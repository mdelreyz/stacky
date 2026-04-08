from datetime import date

from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.models.user import User
from app.schemas.daily_plan import DailyPlanResponse
from app.services.daily_plan import build_daily_plan

router = APIRouter(prefix="/users/me/daily-plan", tags=["daily-plan"])


@router.get("", response_model=DailyPlanResponse)
async def get_daily_plan(
    target_date: date | None = Query(None, alias="date"),
    current_user: User = Depends(get_current_user),
):
    return DailyPlanResponse.model_validate(await build_daily_plan(current_user, target_date))
