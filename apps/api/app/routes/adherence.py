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
from app.models.user_therapy import UserTherapy
from app.schemas.adherence import AdherenceResponse, AdherenceUpdateRequest
from app.services.daily_plan import (
    _is_due_today,
    adherence_day_bounds,
    resolve_user_date,
    scheduled_datetime_for_window,
)

router = APIRouter(prefix="/users/me/adherence", tags=["adherence"])


async def _upsert_adherence(
    *,
    item_type: str,
    item_id: uuid.UUID,
    take_window,
    current_user: User,
    data: AdherenceUpdateRequest,
    session: AsyncSession,
) -> AdherenceResponse:
    target_date, user_tz = resolve_user_date(data.date, current_user.timezone)
    scheduled_at = scheduled_datetime_for_window(target_date, take_window, user_tz)
    day_start_utc, day_end_utc = adherence_day_bounds(target_date, user_tz)

    existing_result = await session.execute(
        select(AdherenceLog).where(
            and_(
                AdherenceLog.user_id == current_user.id,
                AdherenceLog.item_type == item_type,
                AdherenceLog.item_id == item_id,
                AdherenceLog.scheduled_at >= day_start_utc,
                AdherenceLog.scheduled_at < day_end_utc,
            )
        )
    )
    adherence_log = existing_result.scalar_one_or_none()
    if adherence_log is None:
        adherence_log = AdherenceLog(
            user_id=current_user.id,
            item_type=item_type,
            item_id=item_id,
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

    return AdherenceResponse(
        item_id=str(item_id),
        status=data.status,
        scheduled_at=adherence_log.scheduled_at,
        taken_at=adherence_log.taken_at,
        skip_reason=adherence_log.skip_reason,
    )


@router.post("/supplements/{user_supplement_id}", response_model=AdherenceResponse)
async def upsert_supplement_adherence(
    user_supplement_id: uuid.UUID,
    data: AdherenceUpdateRequest,
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

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    if not _is_due_today(user_supplement, target_date):
        raise HTTPException(status_code=400, detail="This supplement is not scheduled for that date")

    return await _upsert_adherence(
        item_type="supplement",
        item_id=user_supplement.id,
        take_window=user_supplement.take_window,
        current_user=current_user,
        data=data,
        session=session,
    )


@router.post("/therapies/{user_therapy_id}", response_model=AdherenceResponse)
async def upsert_therapy_adherence(
    user_therapy_id: uuid.UUID,
    data: AdherenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserTherapy).where(
            UserTherapy.id == user_therapy_id,
            UserTherapy.user_id == current_user.id,
        )
    )
    user_therapy = result.scalar_one_or_none()
    if user_therapy is None:
        raise HTTPException(status_code=404, detail="User therapy not found")

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    if not _is_due_today(user_therapy, target_date):
        raise HTTPException(status_code=400, detail="This therapy is not scheduled for that date")

    return await _upsert_adherence(
        item_type="therapy",
        item_id=user_therapy.id,
        take_window=user_therapy.take_window,
        current_user=current_user,
        data=data,
        session=session,
    )
