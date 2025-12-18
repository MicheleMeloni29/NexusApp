from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..config import get_settings
from ..models import SteamStats, User

settings = get_settings()
STEAM_API_BASE = "https://api.steampowered.com"


def _require_steam_key() -> str:
  if not settings.steam_api_key:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Steam API key not configured")
  return settings.steam_api_key


async def _fetch_owned_games(steam_id: str) -> Dict[str, Any]:
  key = _require_steam_key()
  params = {
    "key": key,
    "steamid": steam_id,
    "include_appinfo": 1,
    "include_played_free_games": 1,
    "format": "json",
  }
  async with httpx.AsyncClient(timeout=20) as client:
    response = await client.get(f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/", params=params)
    if response.status_code >= 400:
      raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Steam API error ({response.status_code})",
      )
    return response.json().get("response", {})


def _summarize_games(games: List[Dict[str, Any]]) -> Dict[str, Any]:
  if not games:
    return {
      "total_hours": 0.0,
      "games_count": 0,
      "recent_hours": 0.0,
      "top_game": None,
      "last_played_game": None,
      "raw_games": [],
    }

  total_minutes = sum(game.get("playtime_forever", 0) for game in games)
  recent_minutes = sum(game.get("playtime_2weeks", 0) for game in games if "playtime_2weeks" in game)
  top_game_entry = max(games, key=lambda g: g.get("playtime_forever", 0), default=None)
  recent_entry = max(games, key=lambda g: g.get("playtime_2weeks", 0), default=None)

  return {
    "total_hours": round(total_minutes / 60, 2),
    "games_count": len(games),
    "recent_hours": round(recent_minutes / 60, 2),
    "top_game": top_game_entry.get("name") if top_game_entry else None,
    "last_played_game": recent_entry.get("name") if recent_entry and recent_entry.get("playtime_2weeks") else None,
    "raw_games": games[:25],  # limit stored payload
  }


def _upsert_stats(session: Session, user: User, summary: Dict[str, Any]) -> SteamStats:
  stats = session.exec(select(SteamStats).where(SteamStats.user_id == user.id)).first()
  if not stats:
    stats = SteamStats(user_id=user.id)
    session.add(stats)

  stats.total_hours = summary["total_hours"]
  stats.games_count = summary["games_count"]
  stats.recent_hours = summary["recent_hours"]
  stats.top_game = summary["top_game"]
  stats.last_played_game = summary["last_played_game"]
  stats.raw_games = summary["raw_games"]
  stats.last_synced_at = datetime.utcnow()
  session.commit()
  session.refresh(stats)
  return stats


async def sync_user(session: Session, user: User) -> SteamStats:
  if not user.steam_id:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User missing Steam ID")
  data = await _fetch_owned_games(user.steam_id)
  games = data.get("games", [])
  summary = _summarize_games(games)
  return _upsert_stats(session, user, summary)
