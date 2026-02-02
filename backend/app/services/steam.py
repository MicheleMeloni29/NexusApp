import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..config import get_settings
from ..models import SteamStats, User

settings = get_settings()
STEAM_API_BASE = "https://api.steampowered.com"
RARE_ACHIEVEMENT_THRESHOLD = 10.0
ACHIEVEMENT_GAME_LIMIT = 20


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


async def _fetch_player_summary(steam_id: str) -> Dict[str, Any]:
  key = _require_steam_key()
  params = {
    "key": key,
    "steamids": steam_id,
    "format": "json",
  }
  async with httpx.AsyncClient(timeout=20) as client:
    response = await client.get(f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/", params=params)
    if response.status_code >= 400:
      raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Steam API error ({response.status_code})",
      )
    players = response.json().get("response", {}).get("players", [])
    return players[0] if players else {}


async def _fetch_player_level(steam_id: str) -> Optional[int]:
  key = _require_steam_key()
  params = {
    "key": key,
    "steamid": steam_id,
    "format": "json",
  }
  async with httpx.AsyncClient(timeout=20) as client:
    response = await client.get(f"{STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/", params=params)
    if response.status_code >= 400:
      raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Steam API error ({response.status_code})",
      )
    return response.json().get("response", {}).get("player_level")


async def _fetch_player_achievements(steam_id: str, appid: int) -> Optional[List[Dict[str, Any]]]:
  key = _require_steam_key()
  params = {
    "key": key,
    "steamid": steam_id,
    "appid": appid,
    "l": "english",
    "format": "json",
  }
  async with httpx.AsyncClient(timeout=20) as client:
    response = await client.get(f"{STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v0001/", params=params)
    if response.status_code >= 400:
      return None
    payload = response.json().get("playerstats", {})
    if payload.get("error") or payload.get("success") == 0:
      return None
    return payload.get("achievements") or []


async def _fetch_global_achievement_percentages(appid: int) -> Optional[Dict[str, float]]:
  params = {
    "gameid": appid,
    "format": "json",
  }
  async with httpx.AsyncClient(timeout=20) as client:
    response = await client.get(f"{STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/", params=params)
    if response.status_code >= 400:
      return None
    achievements = response.json().get("achievementpercentages", {}).get("achievements", [])
    return {item.get("name"): item.get("percent", 0.0) for item in achievements if item.get("name")}


async def _summarize_achievements(steam_id: str, games: List[Dict[str, Any]]) -> Dict[str, Any]:
  if not games:
    return {"achievements": [], "rare_achievements": [], "completed_games": []}

  ranked_games = sorted(games, key=lambda g: g.get("playtime_forever", 0), reverse=True)
  candidates = ranked_games[:ACHIEVEMENT_GAME_LIMIT]
  semaphore = asyncio.Semaphore(4)

  async def _process_game(game: Dict[str, Any]) -> Dict[str, Any]:
    appid = game.get("appid")
    if not appid:
      return {"achievements": [], "rare": [], "completed": None}
    async with semaphore:
      player_achievements = await _fetch_player_achievements(steam_id, appid)
      global_percentages = await _fetch_global_achievement_percentages(appid)
    if not player_achievements:
      return {"achievements": [], "rare": [], "completed": None}

    global_percentages = global_percentages or {}
    achievements: List[Dict[str, Any]] = []
    rare: List[Dict[str, Any]] = []
    achieved = [ach for ach in player_achievements if ach.get("achieved") == 1]
    for ach in achieved:
      name = ach.get("name")
      percent = global_percentages.get(name)
      if not name:
        continue
      entry = {
        "game": game.get("name") or "Unknown",
        "name": name,
        "percent": round(percent, 2) if percent is not None else None,
      }
      achievements.append(entry)
      if percent is not None and percent <= RARE_ACHIEVEMENT_THRESHOLD:
        rare.append(entry)

    completed = None
    if player_achievements and len(achieved) == len(player_achievements):
      completed = {
        "name": game.get("name") or "Unknown",
        "appid": int(appid),
        "hours": round((game.get("playtime_forever", 0) or 0) / 60, 1),
      }

    return {"achievements": achievements, "rare": rare, "completed": completed}

  results = await asyncio.gather(*[_process_game(game) for game in candidates])
  achievements: List[Dict[str, Any]] = []
  rare_achievements: List[Dict[str, Any]] = []
  completed_games: List[Dict[str, Any]] = []

  for result in results:
    achievements.extend(result["achievements"])
    rare_achievements.extend(result["rare"])
    if result["completed"]:
      completed_games.append(result["completed"])

  achievements = sorted(achievements, key=lambda item: item["percent"])
  rare_achievements = sorted(rare_achievements, key=lambda item: item["percent"])[:5]
  completed_games = completed_games[:5]

  return {
    "achievements": achievements,
    "rare_achievements": rare_achievements,
    "completed_games": completed_games,
  }


def _summarize_games(games: List[Dict[str, Any]]) -> Dict[str, Any]:
  if not games:
    return {
      "total_hours": 0.0,
      "games_count": 0,
      "recent_hours": 0.0,
      "longest_session": 0,
      "top_game": None,
      "last_played_game": None,
      "raw_games": [],
    }

  total_minutes = sum(game.get("playtime_forever", 0) for game in games)
  recent_minutes = sum(game.get("playtime_2weeks", 0) for game in games if "playtime_2weeks" in game)
  longest_session_minutes = max((game.get("playtime_forever", 0) for game in games), default=0)
  top_game_entry = max(games, key=lambda g: g.get("playtime_forever", 0), default=None)
  recent_entry = max(games, key=lambda g: g.get("playtime_2weeks", 0), default=None)

  return {
    "total_hours": round(total_minutes / 60, 2),
    "games_count": len(games),
    "recent_hours": round(recent_minutes / 60, 2),
    "longest_session": int(round(longest_session_minutes / 60)),
    "top_game": top_game_entry.get("name") if top_game_entry else None,
    "last_played_game": recent_entry.get("name") if recent_entry and recent_entry.get("playtime_2weeks") else None,
    "raw_games": games[:25],  # limit stored payload
  }


def _summarize_profile(summary: Dict[str, Any], level: Optional[int]) -> Dict[str, Any]:
  avatar_url = summary.get("avatarfull") or summary.get("avatarmedium") or summary.get("avatar")
  return {
    "persona_name": summary.get("personaname"),
    "avatar_url": avatar_url,
    "profile_level": level,
    "profile_created_at": summary.get("timecreated"),
  }


def _upsert_stats(session: Session, user: User, summary: Dict[str, Any]) -> SteamStats:
  stats = session.exec(select(SteamStats).where(SteamStats.user_id == user.id)).first()
  if not stats:
    stats = SteamStats(user_id=user.id)
    session.add(stats)

  stats.total_hours = summary["total_hours"]
  stats.games_count = summary["games_count"]
  stats.recent_hours = summary["recent_hours"]
  stats.longest_session = summary["longest_session"]
  stats.top_game = summary["top_game"]
  stats.last_played_game = summary["last_played_game"]
  stats.persona_name = summary.get("persona_name")
  stats.avatar_url = summary.get("avatar_url")
  stats.profile_level = summary.get("profile_level")
  stats.profile_created_at = summary.get("profile_created_at")
  stats.raw_games = summary["raw_games"]
  stats.achievements = summary.get("achievements")
  stats.rare_achievements = summary.get("rare_achievements")
  stats.completed_games = summary.get("completed_games")
  stats.last_synced_at = datetime.utcnow()
  session.commit()
  session.refresh(stats)
  return stats


async def sync_user(session: Session, user: User) -> SteamStats:
  if not user.steam_id:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User missing Steam ID")
  data, profile, level = await asyncio.gather(
    _fetch_owned_games(user.steam_id),
    _fetch_player_summary(user.steam_id),
    _fetch_player_level(user.steam_id),
  )
  games = data.get("games", [])
  summary = _summarize_games(games)
  summary.update(_summarize_profile(profile, level))
  summary.update(await _summarize_achievements(user.steam_id, games))
  return _upsert_stats(session, user, summary)
