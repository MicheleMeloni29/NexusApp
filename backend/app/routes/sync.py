from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..dependencies import session_dependency
from ..models import User
from ..services import riot as riot_service
from ..services import steam as steam_service

router = APIRouter()


def _get_user(session: Session, user_id: int) -> User:
  user = session.get(User, user_id)
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
  return user


@router.post("/steam")
async def sync_steam_profile(user_id: int, session: Session = Depends(session_dependency)):
  user = _get_user(session, user_id)
  stats = await steam_service.sync_user(session, user)
  return {"provider": "steam", "status": "completed", "stats": stats}


@router.post("/riot")
async def sync_riot_profile(user_id: int, session: Session = Depends(session_dependency)):
  user = _get_user(session, user_id)
  stats = await riot_service.sync_user(session, user)
  return {"provider": "riot", "status": "completed", "stats": stats}
