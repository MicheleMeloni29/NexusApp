from fastapi import APIRouter

from . import auth, recap, sync

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(recap.router, prefix="/recap", tags=["recap"])
