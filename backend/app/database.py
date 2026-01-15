from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings
from .models import AuthState, User

settings = get_settings()
engine = create_engine(settings.database_url, echo=False, connect_args=settings.database_connect_args())


def _ensure_auth_state_payload_column() -> None:
  if engine.dialect.name != "sqlite":
    return

  table = getattr(AuthState, "__tablename__", "authstate")
  with engine.begin() as connection:
    rows = connection.execute(text(f"PRAGMA table_info({table})")).fetchall()
    columns = {row[1] for row in rows}
    if "data" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN data JSON"))


def _ensure_user_columns() -> None:
  if engine.dialect.name != "sqlite":
    return

  table = getattr(User, "__tablename__", "user")
  with engine.begin() as connection:
    rows = connection.execute(text(f"PRAGMA table_info({table})")).fetchall()
    columns = {row[1] for row in rows}
    if "email" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN email TEXT"))
    if "password_hash" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN password_hash TEXT"))
    if "password_salt" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN password_salt TEXT"))
    if "email_verified" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN email_verified BOOLEAN"))
    if "email_verification_token" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN email_verification_token TEXT"))
    if "email_verification_sent_at" not in columns:
      connection.execute(text(f"ALTER TABLE {table} ADD COLUMN email_verification_sent_at TIMESTAMP"))


def init_db() -> None:
  SQLModel.metadata.create_all(engine)
  _ensure_auth_state_payload_column()
  _ensure_user_columns()


@contextmanager
def get_session() -> Iterator[Session]:
  with Session(engine) as session:
    yield session
