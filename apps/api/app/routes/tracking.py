from datetime import date

from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.models.user import User
from app.schemas.tracking import TrackingOverviewResponse
from app.services.tracking import build_tracking_overview

router = APIRouter(prefix="/users/me/tracking", tags=["tracking"])


@router.get("/overview", response_model=TrackingOverviewResponse)
async def get_tracking_overview(
    days: int = Query(14, ge=1, le=90),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    return TrackingOverviewResponse.model_validate(
        await build_tracking_overview(current_user, days=days, end_date=end_date)
    )
