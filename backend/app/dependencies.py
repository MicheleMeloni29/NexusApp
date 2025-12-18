from collections.abc import Generator

from sqlmodel import Session

from .database import get_session


def session_dependency() -> Generator[Session, None, None]:
  with get_session() as session:
    yield session
