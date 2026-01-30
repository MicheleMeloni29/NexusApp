from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  email: Optional[str] = Field(default=None, index=True, unique=True)
  password_hash: Optional[str] = None
  password_salt: Optional[str] = None
  email_verified: bool = Field(default=False)
  email_verification_token: Optional[str] = None
  email_verification_sent_at: Optional[datetime] = None
  steam_id: Optional[str] = Field(default=None, index=True, unique=True)
  riot_puuid: Optional[str] = Field(default=None, index=True, unique=True)
  created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class AuthState(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  provider: str = Field(index=True)
  value: str = Field(unique=True, index=True)
  created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  user_id: Optional[int] = Field(default=None, foreign_key="user.id")
  data: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class RiotToken(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", unique=True)
  access_token: str
  refresh_token: str
  expires_at: datetime
  scope: Optional[str] = None
  updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class AuthSession(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", index=True)
  token: str = Field(unique=True, index=True)
  expires_at: datetime
  created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class SteamStats(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", unique=True, nullable=False)
  total_hours: float = 0
  games_count: int = 0
  recent_hours: float = 0
  longest_session: int = 0
  top_game: Optional[str] = None
  last_played_game: Optional[str] = None
  persona_name: Optional[str] = None
  avatar_url: Optional[str] = None
  profile_level: Optional[int] = None
  profile_created_at: Optional[int] = None
  rare_achievements: Optional[list] = Field(default=None, sa_column=Column(JSON))
  completed_games: Optional[list] = Field(default=None, sa_column=Column(JSON))
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
  riot_account_name: Optional[str] = None
  riot_profile_level: Optional[int] = None
  riot_profile_icon_id: Optional[int] = None
  riot_first_match_timestamp: Optional[int] = None
  riot_years_active: Optional[int] = None
  last_synced_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  raw_matches: Optional[dict] = Field(default=None, sa_column=Column(JSON))
