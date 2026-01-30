from pydantic import BaseModel


class SteamTopGame(BaseModel):
  name: str
  hours: float


class SteamAchievement(BaseModel):
  game: str
  name: str
  percent: float


class SteamCompletedGame(BaseModel):
  name: str
  appid: int
  hours: float


class UserStats(BaseModel):
  year: int = 2024
  top_game: str | None = None
  total_hours: float = 0
  playstyle: str = "Strategist"
  longest_session: int = 0
  steam_persona_name: str | None = None
  steam_avatar_url: str | None = None
  steam_profile_level: int | None = None
  steam_profile_created_at: int | None = None
  steam_top_games: list[SteamTopGame] = []
  steam_rare_achievements: list[SteamAchievement] = []
  steam_completed_games: list[SteamCompletedGame] = []
  steam_games_count: int = 0
  steam_recent_hours: float = 0
  riot_rank: str | None = None
  riot_wins: int = 0
  riot_losses: int = 0
  riot_favorite: str | None = None
  riot_win_rate: float = 0.0
  riot_account_name: str | None = None
  riot_profile_level: int | None = None
  riot_profile_icon_id: int | None = None
  riot_first_match_timestamp: int | None = None
  riot_years_active: int | None = None
