"""Weekly digest route."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.weekly_digest import WeeklyDigestResponse
from app.services.weekly_digest import compute_weekly_digest

router = APIRouter(prefix="/users/me/weekly-digest", tags=["weekly-digest"])


@router.get("", response_model=WeeklyDigestResponse)
async def get_weekly_digest(
    week_end: date | None = Query(None, description="End date of the 7-day window (default: today)"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    digest = await compute_weekly_digest(session, current_user.id, week_end)
    return WeeklyDigestResponse(**digest)
