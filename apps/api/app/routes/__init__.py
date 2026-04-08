from fastapi import APIRouter

from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.supplements import router as supplements_router
from app.routes.user_supplements import router as user_supplements_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(health_router)
v1_router.include_router(auth_router)
v1_router.include_router(supplements_router)
v1_router.include_router(user_supplements_router)
