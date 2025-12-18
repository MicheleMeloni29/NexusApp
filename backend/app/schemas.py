from pydantic import BaseModel


class UserStats(BaseModel):
  year: int = 2024
  top_game: str | None = None
  total_hours: float = 0
  playstyle: str = "Strategist"
  longest_session: int = 0
  steam_games_count: int = 0
  steam_recent_hours: float = 0
  riot_rank: str | None = None
  riot_wins: int = 0
  riot_losses: int = 0
  riot_favorite: str | None = None
  riot_win_rate: float = 0.0
