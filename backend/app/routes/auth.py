import base64
import hashlib
from datetime import datetime, timedelta
from secrets import token_urlsafe
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from ..config import get_settings
from ..dependencies import session_dependency
from ..models import AuthState, RiotToken, User

router = APIRouter()
settings = get_settings()
STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login"
RIOT_AUTH_BASE = settings.riot_auth_base.rstrip("/")


def _provider_availability() -> dict:
  riot_enabled = bool(settings.riot_client_id)
  riot_reason = None
  if not riot_enabled:
    riot_reason = "Riot non configurato. Imposta RIOT_CLIENT_ID nel backend/.env."
  payload = {
    "steam": {"enabled": True},
    "riot": {"enabled": riot_enabled},
  }
  if riot_reason:
    payload["riot"]["reason"] = riot_reason
  return payload


@router.get("/providers")
async def auth_providers():
  return _provider_availability()


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
    if key.startswith("openid."):
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


def _generate_code_verifier() -> str:
  return token_urlsafe(64)


def _build_code_challenge(code_verifier: str) -> str:
  digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
  return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


@router.get("/steam/start")
async def start_steam_login(next: str | None = None, session: Session = Depends(session_dependency)):
  state = token_urlsafe(32)
  _persist_state(session, "steam", state, data={"next": _normalize_next_url(next)})

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
  user = _upsert_steam_user(session, steam_id)
  redirect_url = _build_frontend_redirect(
    (state_record.data or {}).get("next"),
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


@router.get("/riot/start")
async def start_riot_login(
  next: str | None = None,
  client_id: str | None = None,
  session: Session = Depends(session_dependency),
):
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
  user = _upsert_riot_user(session, puuid)
  _store_riot_tokens(session, user, token_payload)
  redirect_url = _build_frontend_redirect(state_data.get("next"), "riot", user.id)
  return RedirectResponse(redirect_url, status_code=status.HTTP_302_FOUND)
