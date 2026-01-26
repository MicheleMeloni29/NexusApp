from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..dependencies import session_dependency
from ..models import RiotStats, SteamStats, User
from ..schemas import UserStats

router = APIRouter()


def _get_user_or_404(session: Session, user_id: int) -> User:
  user = session.get(User, user_id)
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
  return user


def _compose_stats(user: User, steam: SteamStats | None, riot: RiotStats | None) -> UserStats:
  stats = UserStats()
  if steam:
    stats.top_game = steam.top_game
    stats.total_hours = steam.total_hours
    stats.longest_session = max(int(steam.recent_hours // 2), 0)
    stats.steam_persona_name = steam.persona_name
    stats.steam_avatar_url = steam.avatar_url
    stats.steam_profile_level = steam.profile_level
    stats.steam_profile_created_at = steam.profile_created_at
    stats.steam_games_count = steam.games_count
    stats.steam_recent_hours = steam.recent_hours
  if riot:
    stats.riot_rank = riot.rank
    stats.riot_wins = riot.wins
    stats.riot_losses = riot.losses
    stats.riot_favorite = riot.favorite_champion
    stats.riot_win_rate = riot.win_rate
    stats.playstyle = riot.favorite_champion or stats.playstyle
  return stats


@router.get("")
async def get_recap(user_id: int = Query(..., ge=1), session: Session = Depends(session_dependency)) -> UserStats:
  user = _get_user_or_404(session, user_id)
  steam_stats = session.exec(select(SteamStats).where(SteamStats.user_id == user.id)).first()
  riot_stats = session.exec(select(RiotStats).where(RiotStats.user_id == user.id)).first()
  if not steam_stats and not riot_stats:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="No stats available. Sync at least one provider.",
    )
  return _compose_stats(user, steam_stats, riot_stats)
