from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  steam_id: Optional[str] = Field(default=None, index=True, unique=True)
  riot_puuid: Optional[str] = Field(default=None, index=True, unique=True)
  created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class AuthState(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  provider: str = Field(index=True)
  value: str = Field(unique=True, index=True)
  created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class RiotToken(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", unique=True)
  access_token: str
  refresh_token: str
  expires_at: datetime
  scope: Optional[str] = None
  updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class SteamStats(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", unique=True, nullable=False)
  total_hours: float = 0
  games_count: int = 0
  recent_hours: float = 0
  top_game: Optional[str] = None
  last_played_game: Optional[str] = None
  last_synced_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  raw_games: Optional[list] = Field(default=None, sa_column=Column(JSON))


class RiotStats(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", unique=True, nullable=False)
  rank: Optional[str] = None
  tier: Optional[str] = None
  wins: int = 0
  losses: int = 0
  favorite_champion: Optional[str] = None
  matches_tracked: int = 0
  win_rate: float = 0
  last_synced_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  raw_matches: Optional[dict] = Field(default=None, sa_column=Column(JSON))
