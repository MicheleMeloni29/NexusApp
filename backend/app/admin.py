from secrets import compare_digest

from fastapi import FastAPI
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from .config import get_settings
from .database import engine
from .models import RiotStats, RiotToken, SteamStats, User


class AdminAuth(AuthenticationBackend):
  def __init__(self, username: str, password: str) -> None:
    self._username = username
    self._password = password

  async def login(self, request: Request) -> bool:
    form = await request.form()
    username = form.get("username")
    password = form.get("password")
    if not username or not password:
      return False
    if compare_digest(str(username), self._username) and compare_digest(str(password), self._password):
      request.session.update({"admin_logged_in": True})
      return True
    return False

  async def logout(self, request: Request) -> bool:
    request.session.clear()
    return True

  async def authenticate(self, request: Request) -> bool:
    return bool(request.session.get("admin_logged_in"))


class UserAdmin(ModelView, model=User):
  column_list = [User.id, User.email, User.email_verified, User.steam_id, User.riot_puuid, User.created_at]
  column_searchable_list = [User.email, User.steam_id, User.riot_puuid]
  column_sortable_list = [User.id, User.created_at]
  name = "User"
  name_plural = "Users"


class RiotTokenAdmin(ModelView, model=RiotToken):
  column_list = [RiotToken.id, RiotToken.user_id, RiotToken.expires_at, RiotToken.updated_at, RiotToken.scope]
  column_sortable_list = [RiotToken.id, RiotToken.expires_at, RiotToken.updated_at]
  column_default_sort = ("updated_at", True)
  name = "Riot Token"
  name_plural = "Riot Tokens"


class SteamStatsAdmin(ModelView, model=SteamStats):
  column_list = [SteamStats.id, SteamStats.user_id, SteamStats.top_game, SteamStats.total_hours, SteamStats.last_synced_at]
  column_searchable_list = [SteamStats.top_game]
  column_default_sort = ("last_synced_at", True)
  name = "Steam Stats"
  name_plural = "Steam Stats"


class RiotStatsAdmin(ModelView, model=RiotStats):
  column_list = [RiotStats.id, RiotStats.user_id, RiotStats.rank, RiotStats.wins, RiotStats.losses, RiotStats.last_synced_at]
  column_default_sort = ("last_synced_at", True)
  name = "Riot Stats"
  name_plural = "Riot Stats"


def init_admin(app: FastAPI) -> Admin:
  settings = get_settings()
  auth_backend = AdminAuth(settings.admin_username, settings.admin_password)
  admin = Admin(app, engine, title="Nexus Admin", authentication_backend=auth_backend)
  admin.add_view(UserAdmin)
  admin.add_view(RiotTokenAdmin)
  admin.add_view(SteamStatsAdmin)
  admin.add_view(RiotStatsAdmin)
  return admin
