from fastapi import FastAPI
from sqladmin import Admin, ModelView

from .database import engine
from .models import RiotStats, RiotToken, SteamStats, User


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
  admin = Admin(app, engine, title="Nexus Admin")
  admin.add_view(UserAdmin)
  admin.add_view(RiotTokenAdmin)
  admin.add_view(SteamStatsAdmin)
  admin.add_view(RiotStatsAdmin)
  return admin
