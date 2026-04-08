import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.adherence import AdherenceLog
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.schemas.adherence import AdherenceResponse, AdherenceUpdateRequest
from app.services.regimen_schedule import (
    adherence_day_bounds,
    adherence_regime_snapshot_for_item,
    is_regimen_item_scheduled_for_date,
    load_regimen_schedule_context,
    resolve_user_date,
    scheduled_datetime_for_window,
)

router = APIRouter(prefix="/users/me/adherence", tags=["adherence"])


async def _upsert_adherence(
    *,
    item_type: str,
    item_id: uuid.UUID,
    take_window,
    item_name_snapshot: str,
    regimes_snapshot: list[str],
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
    adherence_log.item_name_snapshot = item_name_snapshot
    adherence_log.take_window_snapshot = take_window.value if hasattr(take_window, "value") else str(take_window)
    adherence_log.regimes_snapshot = regimes_snapshot
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
            UserSupplement.is_active.is_(True),
        )
    )
    user_supplement = result.scalar_one_or_none()
    if user_supplement is None:
        raise HTTPException(status_code=404, detail="User supplement not found")

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    schedule_context = await load_regimen_schedule_context(current_user)
    if not is_regimen_item_scheduled_for_date(
        schedule_context,
        item_type="supplement",
        item=user_supplement,
        target_date=target_date,
    ):
        raise HTTPException(status_code=400, detail="This supplement is not scheduled for that date")

    return await _upsert_adherence(
        item_type="supplement",
        item_id=user_supplement.id,
        take_window=user_supplement.take_window,
        item_name_snapshot=user_supplement.supplement.name,
        regimes_snapshot=adherence_regime_snapshot_for_item(
            schedule_context,
            item_type="supplement",
            item=user_supplement,
            target_date=target_date,
        ),
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
            UserTherapy.is_active.is_(True),
        )
    )
    user_therapy = result.scalar_one_or_none()
    if user_therapy is None:
        raise HTTPException(status_code=404, detail="User therapy not found")

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    schedule_context = await load_regimen_schedule_context(current_user)
    if not is_regimen_item_scheduled_for_date(
        schedule_context,
        item_type="therapy",
        item=user_therapy,
        target_date=target_date,
    ):
        raise HTTPException(status_code=400, detail="This therapy is not scheduled for that date")

    response = await _upsert_adherence(
        item_type="therapy",
        item_id=user_therapy.id,
        take_window=user_therapy.take_window,
        item_name_snapshot=user_therapy.therapy.name,
        regimes_snapshot=adherence_regime_snapshot_for_item(
            schedule_context,
            item_type="therapy",
            item=user_therapy,
            target_date=target_date,
        ),
        current_user=current_user,
        data=data,
        session=session,
    )
    if data.status == "taken" and response.taken_at is not None:
        next_settings = dict(user_therapy.settings or {})
        next_settings["last_completed_at"] = response.taken_at.isoformat()
        user_therapy.settings = next_settings
        await session.commit()
    return response


@router.post("/medications/{user_medication_id}", response_model=AdherenceResponse)
async def upsert_medication_adherence(
    user_medication_id: uuid.UUID,
    data: AdherenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserMedication).where(
            UserMedication.id == user_medication_id,
            UserMedication.user_id == current_user.id,
            UserMedication.is_active.is_(True),
        )
    )
    user_medication = result.scalar_one_or_none()
    if user_medication is None:
        raise HTTPException(status_code=404, detail="User medication not found")

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    schedule_context = await load_regimen_schedule_context(current_user)
    if not is_regimen_item_scheduled_for_date(
        schedule_context,
        item_type="medication",
        item=user_medication,
        target_date=target_date,
    ):
        raise HTTPException(status_code=400, detail="This medication is not scheduled for that date")

    return await _upsert_adherence(
        item_type="medication",
        item_id=user_medication.id,
        take_window=user_medication.take_window,
        item_name_snapshot=user_medication.medication.name,
        regimes_snapshot=adherence_regime_snapshot_for_item(
            schedule_context,
            item_type="medication",
            item=user_medication,
            target_date=target_date,
        ),
        current_user=current_user,
        data=data,
        session=session,
    )
