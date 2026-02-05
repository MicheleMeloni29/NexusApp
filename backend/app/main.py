from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .admin import init_admin
from .config import get_settings
from .database import init_db
from .routes import api_router


def create_app() -> FastAPI:
  settings = get_settings()
  init_db()

  application = FastAPI(title=settings.project_name)

  application.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )
  application.add_middleware(SessionMiddleware, secret_key=settings.admin_session_secret)

  @application.get("/health", tags=["health"])
  async def health_check():
    return {"status": "ok"}

  application.include_router(api_router, prefix=settings.api_v1_prefix)
  init_admin(application)
  return application


app = create_app()
