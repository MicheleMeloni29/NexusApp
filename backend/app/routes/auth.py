import base64
import hashlib
import hmac
import os
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from secrets import token_urlsafe
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from ..config import get_settings
from ..dependencies import session_dependency
from ..models import AuthSession, AuthState, RiotStats, RiotToken, SteamStats, User

router = APIRouter()
settings = get_settings()
STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login"
RIOT_AUTH_BASE = settings.riot_auth_base.rstrip("/")
SESSION_COOKIE_NAME = "nexus_session"


def _provider_availability() -> dict:
  riot_enabled = bool(settings.riot_client_id)
  riot_reason = None
  if settings.riot_dev_bypass_auth:
    riot_enabled = bool(settings.riot_dev_puuid)
    if not riot_enabled:
      riot_reason = "Riot bypass attivo. Imposta RIOT_DEV_PUUID nel backend/.env."
  elif not riot_enabled:
    riot_reason = "Riot non configurato. Imposta RIOT_CLIENT_ID nel backend/.env."
  payload = {
    "steam": {"enabled": True},
    "riot": {"enabled": riot_enabled},
  }
  if riot_reason:
    payload["riot"]["reason"] = riot_reason
  return payload


class AuthCredentials(BaseModel):
  email: str
  password: str


def _normalize_email(email: str) -> str:
  return email.strip().lower()


def _hash_password(password: str, salt: bytes) -> str:
  return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000).hex()


def _verify_password(password: str, salt_hex: str, expected_hash: str) -> bool:
  computed = _hash_password(password, bytes.fromhex(salt_hex))
  return hmac.compare_digest(computed, expected_hash)


def _hash_email_token(token: str) -> str:
  return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _build_verification_link(token: str) -> str:
  base = settings.backend_origin.rstrip("/")
  return f"{base}{settings.api_v1_prefix}/auth/verify?token={token}"


def _send_verification_email(email: str, token: str) -> None:
  link = _build_verification_link(token)
  if not settings.smtp_host or not settings.smtp_from:
    print(f"Verification link for {email}: {link}")
    return

  message = EmailMessage()
  message["Subject"] = "Conferma il tuo account"
  message["From"] = settings.smtp_from
  message["To"] = email
  message.set_content(
    "Clicca il link per confermare il tuo account:\n"
    f"{link}\n"
  )

  with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as client:
    if settings.smtp_use_tls:
      client.starttls()
    if settings.smtp_username:
      client.login(settings.smtp_username, settings.smtp_password or "")
    client.send_message(message)


def _create_session(session: Session, user: User) -> str:
  token = token_urlsafe(32)
  expires_at = datetime.utcnow() + timedelta(days=settings.session_ttl_days)
  session.add(AuthSession(user_id=user.id, token=token, expires_at=expires_at))
  session.commit()
  return token


def _set_session_cookie(response: Response, token: str) -> None:
  max_age = settings.session_ttl_days * 24 * 60 * 60
  response.set_cookie(
    key=SESSION_COOKIE_NAME,
    value=token,
    max_age=max_age,
    httponly=True,
    samesite="lax",
  )


def _clear_session_cookie(response: Response) -> None:
  response.delete_cookie(SESSION_COOKIE_NAME)


def _get_current_user(session: Session, request: Request) -> User | None:
  token = request.cookies.get(SESSION_COOKIE_NAME)
  if not token:
    return None
  record = session.exec(select(AuthSession).where(AuthSession.token == token)).first()
  if not record:
    return None
  if record.expires_at <= datetime.utcnow():
    session.delete(record)
    session.commit()
    return None
  return session.get(User, record.user_id)


@router.get("/providers")
async def auth_providers():
  return _provider_availability()


@router.post("/register")
async def register_account(
  payload: AuthCredentials,
  response: Response,
  session: Session = Depends(session_dependency),
):
  email = _normalize_email(payload.email)
  if not email or not payload.password:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email e password obbligatorie")
  existing = session.exec(select(User).where(User.email == email)).first()
  if existing:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email gia' registrata")
  salt = os.urandom(16).hex()
  password_hash = _hash_password(payload.password, bytes.fromhex(salt))

  user = User(
    email=email,
    password_hash=password_hash,
    password_salt=salt,
    email_verified=True,
    email_verification_token=None,
    email_verification_sent_at=None,
  )
  session.add(user)
  session.commit()
  session.refresh(user)
  session_token = _create_session(session, user)
  _set_session_cookie(response, session_token)
  return {"ok": True}


@router.post("/login")
async def login_account(
  payload: AuthCredentials,
  response: Response,
  session: Session = Depends(session_dependency),
):
  email = _normalize_email(payload.email)
  user = session.exec(select(User).where(User.email == email)).first()
  if not user or not user.password_hash or not user.password_salt:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenziali non valide")
  if not _verify_password(payload.password, user.password_salt, user.password_hash):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenziali non valide")
  token = _create_session(session, user)
  _set_session_cookie(response, token)
  return {"user_id": user.id, "email": user.email}


@router.get("/verify")
async def verify_account(
  token: str,
  session: Session = Depends(session_dependency),
):
  if not token:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing verification token")
  token_hash = _hash_email_token(token)
  user = session.exec(select(User).where(User.email_verification_token == token_hash)).first()
  if not user:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
  if user.email_verification_sent_at:
    expires_at = user.email_verification_sent_at + timedelta(hours=settings.email_verification_ttl_hours)
    if expires_at <= datetime.utcnow():
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link expired")
  user.email_verified = True
  user.email_verification_token = None
  user.email_verification_sent_at = None
  session.add(user)
  session.commit()
  session.refresh(user)
  session_token = _create_session(session, user)
  redirect = RedirectResponse(settings.frontend_origin.rstrip("/"), status_code=status.HTTP_302_FOUND)
  _set_session_cookie(redirect, session_token)
  return redirect


@router.post("/logout")
async def logout_account(
  response: Response,
  request: Request,
  session: Session = Depends(session_dependency),
):
  token = request.cookies.get(SESSION_COOKIE_NAME)
  if token:
    record = session.exec(select(AuthSession).where(AuthSession.token == token)).first()
    if record:
      session.delete(record)
      session.commit()
  _clear_session_cookie(response)
  return {"ok": True}


@router.get("/me")
async def get_current_account(request: Request, session: Session = Depends(session_dependency)):
  user = _get_current_user(session, request)
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
  return {
    "user_id": user.id,
    "email": user.email,
    "email_verified": user.email_verified,
    "steam_connected": bool(user.steam_id),
    "riot_connected": bool(user.riot_puuid),
    "steam_id": user.steam_id,
    "riot_puuid": user.riot_puuid,
  }


@router.post("/disconnect/{provider}")
async def disconnect_provider(
  provider: str,
  request: Request,
  session: Session = Depends(session_dependency),
):
  user = _get_current_user(session, request)
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

  if provider == "steam":
    user.steam_id = None
    steam_stats = session.exec(select(SteamStats).where(SteamStats.user_id == user.id)).first()
    if steam_stats:
      session.delete(steam_stats)
  elif provider == "riot":
    user.riot_puuid = None
    riot_token = session.exec(select(RiotToken).where(RiotToken.user_id == user.id)).first()
    if riot_token:
      session.delete(riot_token)
    riot_stats = session.exec(select(RiotStats).where(RiotStats.user_id == user.id)).first()
    if riot_stats:
      session.delete(riot_stats)
  else:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported provider")

  session.add(user)
  session.commit()
  return {"ok": True}


def _persist_state(
  session: Session,
  provider: str,
  value: str,
  user: User | None = None,
  data: dict | None = None,
) -> None:
  state = AuthState(provider=provider, value=value, user_id=user.id if user else None, data=data)
  session.add(state)
  session.commit()


def _consume_state(session: Session, provider: str, value: str) -> AuthState:
  state = session.exec(select(AuthState).where(AuthState.provider == provider, AuthState.value == value)).first()
  if not state:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired state")
  session.delete(state)
  session.commit()
  return state


def _extract_steam_id(claimed_id: str) -> str:
  return claimed_id.rsplit("/", 1)[-1]


def _normalize_next_url(next_url: str | None) -> str:
  default_next = f"{settings.frontend_origin.rstrip('/')}/accesso"
  if not next_url:
    return default_next

  parsed = urlparse(next_url)
  if not parsed.netloc:
    next_url = f"{settings.frontend_origin.rstrip('/')}/{next_url.lstrip('/')}"
    parsed = urlparse(next_url)

  frontend = urlparse(settings.frontend_origin)
  if parsed.scheme not in ("http", "https") or parsed.netloc != frontend.netloc:
    return default_next

  return next_url


def _build_frontend_redirect(next_url: str | None, provider: str, user_id: int) -> str:
  base_url = _normalize_next_url(next_url)
  parsed = urlparse(base_url)
  query = parse_qs(parsed.query)
  query["provider"] = [provider]
  query["user_id"] = [str(user_id)]
  return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


async def _verify_steam_response(params: dict) -> bool:
  payload = {
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "check_authentication",
  }
  for key, value in params.items():
    if key.startswith("openid.") and key != "openid.mode":
      payload[key] = value

  async with httpx.AsyncClient() as client:
    response = await client.post(STEAM_OPENID_ENDPOINT, data=payload)
    return "is_valid:true" in response.text


def _upsert_steam_user(session: Session, steam_id: str) -> User:
  user = session.exec(select(User).where(User.steam_id == steam_id)).first()
  if user:
    return user
  user = User(steam_id=steam_id)
  session.add(user)
  session.commit()
  session.refresh(user)
  return user


def _link_steam_user(session: Session, user: User, steam_id: str) -> User:
  existing = session.exec(select(User).where(User.steam_id == steam_id, User.id != user.id)).first()
  if existing:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Steam account already linked")
  if user.steam_id and user.steam_id != steam_id:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Different Steam account already linked")
  user.steam_id = steam_id
  session.add(user)
  session.commit()
  session.refresh(user)
  return user


def _generate_code_verifier() -> str:
  return token_urlsafe(64)


def _build_code_challenge(code_verifier: str) -> str:
  digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
  return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


@router.get("/steam/start")
async def start_steam_login(
  request: Request,
  next: str | None = None,
  session: Session = Depends(session_dependency),
):
  state = token_urlsafe(32)
  current_user = _get_current_user(session, request)
  _persist_state(
    session,
    "steam",
    state,
    data={"next": _normalize_next_url(next), "user_id": current_user.id if current_user else None},
  )

  return_to = f"{settings.steam_return_url}?state={state}"
  query = {
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": return_to,
    "openid.realm": settings.steam_realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  }
  url = f"{STEAM_OPENID_ENDPOINT}?{urlencode(query)}"
  return RedirectResponse(url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/steam/callback")
async def steam_callback(request: Request, state: str, session: Session = Depends(session_dependency)):
  params = dict(request.query_params)
  if not await _verify_steam_response(params):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to verify Steam response")

  claimed_id = params.get("openid.claimed_id")
  if not claimed_id:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing claimed_id")

  state_record = _consume_state(session, "steam", state)
  steam_id = _extract_steam_id(claimed_id)
  state_data = state_record.data or {}
  user_id = state_data.get("user_id")
  if user_id:
    user = session.get(User, user_id)
    if not user:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session user")
    user = _link_steam_user(session, user, steam_id)
  else:
    user = _upsert_steam_user(session, steam_id)
  redirect_url = _build_frontend_redirect(
    state_data.get("next"),
    "steam",
    user.id,
  )
  return RedirectResponse(redirect_url, status_code=status.HTTP_302_FOUND)


def _riot_authorize_url(client_id: str, state: str, code_challenge: str) -> str:
  if not client_id:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Riot client ID not configured")
  params = {
    "client_id": client_id,
    "redirect_uri": settings.riot_redirect_uri,
    "response_type": "code",
    "scope": settings.riot_scope,
    "state": state,
    "code_challenge": code_challenge,
    "code_challenge_method": "S256",
  }
  return f"{RIOT_AUTH_BASE}/authorize?{urlencode(params)}"


async def _exchange_riot_code(code: str, code_verifier: str, client_id: str, client_secret: str | None) -> dict:
  if not client_id:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Riot client ID not configured")
  data = {
    "grant_type": "authorization_code",
    "code": code,
    "redirect_uri": settings.riot_redirect_uri,
    "code_verifier": code_verifier,
  }
  auth = None
  if client_secret:
    auth = (client_id, client_secret)
  else:
    data["client_id"] = client_id

  async with httpx.AsyncClient() as client:
    response = await client.post(f"{RIOT_AUTH_BASE}/token", data=data, auth=auth)
    if response.status_code >= 400:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to exchange Riot code")
    return response.json()


async def _fetch_riot_profile(access_token: str) -> dict:
  headers = {"Authorization": f"Bearer {access_token}"}
  url = f"https://{settings.riot_region}.api.riotgames.com/riot/account/v1/accounts/me"
  async with httpx.AsyncClient() as client:
    response = await client.get(url, headers=headers)
    if response.status_code >= 400:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to fetch Riot profile")
    return response.json()


def _upsert_riot_user(session: Session, puuid: str) -> User:
  user = session.exec(select(User).where(User.riot_puuid == puuid)).first()
  if user:
    return user
  user = User(riot_puuid=puuid)
  session.add(user)
  session.commit()
  session.refresh(user)
  return user


def _link_riot_user(session: Session, user: User, puuid: str) -> User:
  existing = session.exec(select(User).where(User.riot_puuid == puuid, User.id != user.id)).first()
  if existing:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Riot account already linked")
  if user.riot_puuid and user.riot_puuid != puuid:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Different Riot account already linked")
  user.riot_puuid = puuid
  session.add(user)
  session.commit()
  session.refresh(user)
  return user


def _store_riot_tokens(session: Session, user: User, token_payload: dict) -> RiotToken:
  expires_in = token_payload.get("expires_in", 0)
  expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
  token = session.exec(select(RiotToken).where(RiotToken.user_id == user.id)).first()
  if token:
    token.access_token = token_payload["access_token"]
    token.refresh_token = token_payload.get("refresh_token", token.refresh_token)
    token.expires_at = expires_at
    token.scope = token_payload.get("scope")
    token.updated_at = datetime.utcnow()
  else:
    token = RiotToken(
      user_id=user.id,
      access_token=token_payload["access_token"],
      refresh_token=token_payload.get("refresh_token", ""),
      expires_at=expires_at,
      scope=token_payload.get("scope"),
    )
    session.add(token)

  session.commit()
  session.refresh(token)
  return token


def _resolve_riot_dev_puuid(puuid: str | None) -> str:
  resolved = (puuid or settings.riot_dev_puuid or "").strip()
  if not resolved:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Missing Riot PUUID for dev bypass. Set RIOT_DEV_PUUID or pass ?puuid=...",
    )
  return resolved


def _start_riot_dev_login(
  next_url: str | None,
  puuid: str | None,
  session: Session,
  current_user: User | None,
) -> RedirectResponse:
  dev_puuid = _resolve_riot_dev_puuid(puuid)
  if current_user:
    user = _link_riot_user(session, current_user, dev_puuid)
  else:
    user = _upsert_riot_user(session, dev_puuid)
  _store_riot_tokens(
    session,
    user,
    {
      "access_token": "dev-token",
      "refresh_token": "dev-refresh",
      "expires_in": 60 * 60 * 24 * 30,
      "scope": "dev",
    },
  )
  redirect_url = _build_frontend_redirect(_normalize_next_url(next_url), "riot", user.id)
  return RedirectResponse(redirect_url, status_code=status.HTTP_302_FOUND)


@router.get("/riot/start")
async def start_riot_login(
  request: Request,
  next: str | None = None,
  client_id: str | None = None,
  puuid: str | None = None,
  session: Session = Depends(session_dependency),
):
  current_user = _get_current_user(session, request)
  if settings.riot_dev_bypass_auth:
    return _start_riot_dev_login(next, puuid, session, current_user)
  resolved_client_id = (client_id or settings.riot_client_id or "").strip()
  if not resolved_client_id:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Riot client ID not configured")
  state = token_urlsafe(32)
  code_verifier = _generate_code_verifier()
  code_challenge = _build_code_challenge(code_verifier)
  _persist_state(
    session,
    "riot",
    state,
    data={
      "next": _normalize_next_url(next),
      "code_verifier": code_verifier,
      "client_id": resolved_client_id,
      "user_id": current_user.id if current_user else None,
    },
  )
  url = _riot_authorize_url(resolved_client_id, state, code_challenge)
  return RedirectResponse(url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/riot/callback")
async def riot_callback(code: str | None = None, state: str | None = None, session: Session = Depends(session_dependency)):
  if not code:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Riot code")
  if not state:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing state")

  state_record = _consume_state(session, "riot", state)
  state_data = state_record.data or {}
  code_verifier = state_data.get("code_verifier")
  if not code_verifier:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing PKCE verifier")

  client_id = state_data.get("client_id") or settings.riot_client_id
  if not client_id:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Riot client ID not configured")
  token_payload = await _exchange_riot_code(code, code_verifier, client_id, settings.riot_client_secret)
  profile = await _fetch_riot_profile(token_payload["access_token"])
  puuid = profile.get("puuid")
  if not puuid:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Riot profile missing PUUID")
  user_id = state_data.get("user_id")
  if user_id:
    user = session.get(User, user_id)
    if not user:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session user")
    user = _link_riot_user(session, user, puuid)
  else:
    user = _upsert_riot_user(session, puuid)
  _store_riot_tokens(session, user, token_payload)
  redirect_url = _build_frontend_redirect(state_data.get("next"), "riot", user.id)
  return RedirectResponse(redirect_url, status_code=status.HTTP_302_FOUND)
