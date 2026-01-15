from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..config import get_settings
from ..models import RiotStats, RiotToken, User

settings = get_settings()


def _require_api_key() -> str:
  if not settings.riot_api_key:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Riot API key not configured")
  return settings.riot_api_key


def _riot_headers() -> Dict[str, str]:
  return {"X-Riot-Token": _require_api_key()}


async def _get_json(url: str, headers: Optional[Dict[str, str]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
  async with httpx.AsyncClient(timeout=20) as client:
    response = await client.get(url, headers=headers, params=params)
    if response.status_code >= 400:
      raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Riot API error {response.status_code}")
    return response.json()


async def _fetch_summoner_by_puuid(puuid: str) -> Dict[str, Any]:
  url = f"https://{settings.riot_lol_region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
  return await _get_json(url, headers=_riot_headers())


async def _fetch_league_entries(summoner_id: str) -> List[Dict[str, Any]]:
  url = f"https://{settings.riot_lol_region}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner_id}"
  data = await _get_json(url, headers=_riot_headers())
  return data if isinstance(data, list) else []


async def _fetch_match_ids(puuid: str, count: int = 10) -> List[str]:
  params = {"start": 0, "count": count}
  url = f"https://{settings.riot_match_region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids"
  data = await _get_json(url, headers=_riot_headers(), params=params)
  return data if isinstance(data, list) else []


async def _fetch_match(match_id: str) -> Dict[str, Any]:
  url = f"https://{settings.riot_match_region}.api.riotgames.com/lol/match/v5/matches/{match_id}"
  return await _get_json(url, headers=_riot_headers())


def _summarize_league(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
  if not entries:
    return {"rank": None, "tier": None, "wins": 0, "losses": 0}

  solo = next((entry for entry in entries if entry.get("queueType") == "RANKED_SOLO_5x5"), entries[0])
  tier = solo.get("tier")
  division = solo.get("rank")
  rank = f"{tier} {division}".strip() if tier else None
  return {
    "rank": rank,
    "tier": tier,
    "wins": solo.get("wins", 0),
    "losses": solo.get("losses", 0),
  }


async def _summarize_matches(puuid: str, match_ids: List[str]) -> Dict[str, Any]:
  if not match_ids:
    return {"favorite_champion": None, "matches": 0, "win_rate": 0.0}

  matches_considered = 0
  wins = 0
  champions: Counter[str] = Counter()

  for match_id in match_ids[:5]:  # limit to reduce load
    data = await _fetch_match(match_id)
    info = data.get("info", {})
    participants = info.get("participants", [])
    player = next((p for p in participants if p.get("puuid") == puuid), None)
    if not player:
      continue
    matches_considered += 1
    if player.get("win"):
      wins += 1
    champ = player.get("championName")
    if champ:
      champions[champ] += 1

  if matches_considered == 0:
    return {"favorite_champion": None, "matches": 0, "win_rate": 0.0}

  favorite = champions.most_common(1)[0][0] if champions else None
  return {
    "favorite_champion": favorite,
    "matches": matches_considered,
    "win_rate": round((wins / matches_considered) * 100, 2),
  }


def _upsert_stats(session: Session, user: User, summary: Dict[str, Any]) -> RiotStats:
  stats = session.exec(select(RiotStats).where(RiotStats.user_id == user.id)).first()
  if not stats:
    stats = RiotStats(user_id=user.id)
    session.add(stats)

  stats.rank = summary["league"]["rank"]
  stats.tier = summary["league"]["tier"]
  stats.wins = summary["league"]["wins"]
  stats.losses = summary["league"]["losses"]
  stats.favorite_champion = summary["matches"]["favorite_champion"]
  stats.matches_tracked = summary["matches"]["matches"]
  stats.win_rate = summary["matches"]["win_rate"]
  stats.raw_matches = {
    "league": summary["league"],
    "matches": summary["match_ids"],
  }
  stats.last_synced_at = datetime.utcnow()

  session.commit()
  session.refresh(stats)
  return stats


def _build_mock_summary(puuid: str) -> Dict[str, Any]:
  return {
    "league": {
      "rank": "GOLD IV",
      "tier": "GOLD",
      "wins": 42,
      "losses": 30,
    },
    "matches": {
      "favorite_champion": "Ahri",
      "matches": 5,
      "win_rate": 58.33,
    },
    "match_ids": [f"DEV_MATCH_{index + 1}_{puuid[:6]}" for index in range(5)],
  }


async def sync_user(session: Session, user: User) -> RiotStats:
  if not user.riot_puuid:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User missing Riot PUUID")
  if settings.riot_dev_mock_stats:
    summary = _build_mock_summary(user.riot_puuid)
    return _upsert_stats(session, user, summary)
  token = session.exec(select(RiotToken).where(RiotToken.user_id == user.id)).first()
  if not token:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has not authorized Riot access")
  if token.expires_at <= datetime.utcnow():
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Riot token expired, please relink account")
  summoner = await _fetch_summoner_by_puuid(user.riot_puuid)
  entries = await _fetch_league_entries(summoner["id"])
  match_ids = await _fetch_match_ids(user.riot_puuid)
  matches_summary = await _summarize_matches(user.riot_puuid, match_ids)

  summary = {
    "league": _summarize_league(entries),
    "matches": matches_summary,
    "match_ids": match_ids[:20],
  }
  return _upsert_stats(session, user, summary)
