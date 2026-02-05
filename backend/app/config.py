from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  """Application configuration loaded from environment variables."""

  project_name: str = "Nexus API"
  api_v1_prefix: str = "/api/v1"
  frontend_origin: str = "http://localhost:3000"
  backend_origin: str = "http://localhost:8000"
  allowed_origins: List[str] = []

  database_url: str = "sqlite:///./nexus.db"
  sqlite_journal_mode: str = "WAL"

  session_ttl_days: int = 30
  email_verification_ttl_hours: int = 24
  session_cookie_samesite: str = "lax"
  session_cookie_secure: bool = False

  smtp_host: Optional[str] = None
  smtp_port: int = 587
  smtp_username: Optional[str] = None
  smtp_password: Optional[str] = None
  smtp_from: Optional[str] = None
  smtp_use_tls: bool = True

  steam_api_key: Optional[str] = None
  steam_return_url: str = "http://localhost:8000/api/v1/auth/steam/callback"
  steam_realm: str = "http://localhost:8000"

  riot_client_id: Optional[str] = None
  riot_client_secret: Optional[str] = None
  riot_redirect_uri: str = "http://localhost:8000/api/v1/auth/riot/callback"
  riot_auth_base: str = "https://auth.riotgames.com"
  riot_dev_bypass_auth: bool = False
  riot_dev_puuid: Optional[str] = None
  riot_dev_mock_stats: bool = False
  riot_scope: str = "openid offline_access"
  riot_region: str = "eu"
  riot_api_key: Optional[str] = None
  riot_lol_region: str = "euw1"
  riot_match_region: str = "europe"
  admin_username: str = "admin"
  admin_password: str = "change-me"
  admin_session_secret: str = "change-me-secret"

  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

  def cors_origins(self) -> List[str]:
    if self.allowed_origins:
      return self.allowed_origins
    return [self.frontend_origin]

  def database_connect_args(self) -> dict:
    if self.database_url.startswith("sqlite"):
      return {"check_same_thread": False}
    return {}


@lru_cache
def get_settings() -> Settings:
  return Settings()
