from fastapi import APIRouter

from app.schemas.common import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    return HealthStatus()
