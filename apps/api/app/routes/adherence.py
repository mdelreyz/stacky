import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.adherence import AdherenceLog
from app.models.user import User
from app.models.user_supplement import UserSupplement
from app.schemas.adherence import SupplementAdherenceResponse, SupplementAdherenceUpdateRequest
from app.services.daily_plan import (
    _is_due_today,
    adherence_day_bounds,
    resolve_user_date,
    scheduled_datetime_for_window,
)

router = APIRouter(prefix="/users/me/adherence", tags=["adherence"])


@router.post("/supplements/{user_supplement_id}", response_model=SupplementAdherenceResponse)
async def upsert_supplement_adherence(
    user_supplement_id: uuid.UUID,
    data: SupplementAdherenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserSupplement).where(
            UserSupplement.id == user_supplement_id,
            UserSupplement.user_id == current_user.id,
        )
    )
    user_supplement = result.scalar_one_or_none()
    if user_supplement is None:
        raise HTTPException(status_code=404, detail="User supplement not found")

    target_date, user_tz = resolve_user_date(data.date, current_user.timezone)
    if not _is_due_today(user_supplement, target_date):
        raise HTTPException(status_code=400, detail="This supplement is not scheduled for that date")

    scheduled_at = scheduled_datetime_for_window(target_date, user_supplement.take_window, user_tz)
    day_start_utc, day_end_utc = adherence_day_bounds(target_date, user_tz)

    existing_result = await session.execute(
        select(AdherenceLog).where(
            and_(
                AdherenceLog.user_id == current_user.id,
                AdherenceLog.item_type == "supplement",
                AdherenceLog.item_id == user_supplement.id,
                AdherenceLog.scheduled_at >= day_start_utc,
                AdherenceLog.scheduled_at < day_end_utc,
            )
        )
    )
    adherence_log = existing_result.scalar_one_or_none()
    if adherence_log is None:
        adherence_log = AdherenceLog(
            user_id=current_user.id,
            item_type="supplement",
            item_id=user_supplement.id,
            scheduled_at=scheduled_at,
        )
        session.add(adherence_log)

    adherence_log.scheduled_at = scheduled_at
    if data.status == "taken":
        adherence_log.taken_at = datetime.now(timezone.utc)
        adherence_log.skipped = False
        adherence_log.skip_reason = None
    else:
        adherence_log.taken_at = None
        adherence_log.skipped = True
        adherence_log.skip_reason = data.skip_reason

    await session.commit()
    await session.refresh(adherence_log)

    return SupplementAdherenceResponse(
        item_id=str(user_supplement.id),
        status=data.status,
        scheduled_at=adherence_log.scheduled_at,
        taken_at=adherence_log.taken_at,
        skip_reason=adherence_log.skip_reason,
    )
