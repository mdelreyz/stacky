import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.adherence import AdherenceLog
from app.models.user import User
from app.models.protocol import Protocol, ProtocolItem
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from sqlalchemy.orm import selectinload

from app.schemas.adherence import (
    AdherenceResponse,
    AdherenceUpdateRequest,
    BatchAdherenceItemResult,
    BatchAdherenceRequest,
    BatchAdherenceResponse,
)
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
    dosage_snapshot: dict | None = None,
    settings_snapshot: dict | None = None,
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
    adherence_log.dosage_snapshot = dosage_snapshot
    adherence_log.settings_snapshot = settings_snapshot
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
        dosage_snapshot={"amount": float(user_supplement.dosage_amount), "unit": user_supplement.dosage_unit},
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

    therapy_settings = {
        "duration_minutes": user_therapy.duration_minutes,
        **(user_therapy.settings or {}),
    }
    therapy_settings.pop("last_completed_at", None)

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
        settings_snapshot=therapy_settings,
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
        dosage_snapshot={"amount": float(user_medication.dosage_amount), "unit": user_medication.dosage_unit},
        current_user=current_user,
        data=data,
        session=session,
    )


@router.post("/peptides/{user_peptide_id}", response_model=AdherenceResponse)
async def upsert_peptide_adherence(
    user_peptide_id: uuid.UUID,
    data: AdherenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserPeptide).where(
            UserPeptide.id == user_peptide_id,
            UserPeptide.user_id == current_user.id,
            UserPeptide.is_active.is_(True),
        )
    )
    user_peptide = result.scalar_one_or_none()
    if user_peptide is None:
        raise HTTPException(status_code=404, detail="User peptide not found")

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    schedule_context = await load_regimen_schedule_context(current_user)
    if not is_regimen_item_scheduled_for_date(
        schedule_context,
        item_type="peptide",
        item=user_peptide,
        target_date=target_date,
    ):
        raise HTTPException(status_code=400, detail="This peptide is not scheduled for that date")

    return await _upsert_adherence(
        item_type="peptide",
        item_id=user_peptide.id,
        take_window=user_peptide.take_window,
        item_name_snapshot=user_peptide.peptide.name,
        regimes_snapshot=adherence_regime_snapshot_for_item(
            schedule_context,
            item_type="peptide",
            item=user_peptide,
            target_date=target_date,
        ),
        dosage_snapshot={"amount": float(user_peptide.dosage_amount), "unit": user_peptide.dosage_unit},
        current_user=current_user,
        data=data,
        session=session,
    )


def _protocol_with_items_query(user_id: uuid.UUID, protocol_id: uuid.UUID):
    return (
        select(Protocol)
        .where(Protocol.id == protocol_id, Protocol.user_id == user_id, Protocol.is_active.is_(True))
        .options(
            selectinload(Protocol.items)
            .selectinload(ProtocolItem.user_supplement)
            .selectinload(UserSupplement.supplement),
            selectinload(Protocol.items)
            .selectinload(ProtocolItem.user_medication)
            .selectinload(UserMedication.medication),
            selectinload(Protocol.items)
            .selectinload(ProtocolItem.user_therapy)
            .selectinload(UserTherapy.therapy),
            selectinload(Protocol.items)
            .selectinload(ProtocolItem.user_peptide)
            .selectinload(UserPeptide.peptide),
        )
    )


def _resolve_protocol_item(item: ProtocolItem):
    """Return (item_type, user_item, item_name, dosage_snapshot, settings_snapshot) for a protocol item."""
    if item.item_type == "supplement" and item.user_supplement is not None:
        us = item.user_supplement
        return (
            "supplement",
            us,
            us.supplement.name,
            {"amount": float(us.dosage_amount), "unit": us.dosage_unit},
            None,
        )
    if item.item_type == "medication" and item.user_medication is not None:
        um = item.user_medication
        return (
            "medication",
            um,
            um.medication.name,
            {"amount": float(um.dosage_amount), "unit": um.dosage_unit},
            None,
        )
    if item.item_type == "therapy" and item.user_therapy is not None:
        ut = item.user_therapy
        therapy_settings = {"duration_minutes": ut.duration_minutes, **(ut.settings or {})}
        therapy_settings.pop("last_completed_at", None)
        return ("therapy", ut, ut.therapy.name, None, therapy_settings)
    if item.item_type == "peptide" and item.user_peptide is not None:
        up = item.user_peptide
        return (
            "peptide",
            up,
            up.peptide.name,
            {"amount": float(up.dosage_amount), "unit": up.dosage_unit},
            None,
        )
    return None


@router.post("/protocols/{protocol_id}", response_model=BatchAdherenceResponse)
async def batch_protocol_adherence(
    protocol_id: uuid.UUID,
    data: BatchAdherenceRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(_protocol_with_items_query(current_user.id, protocol_id))
    protocol = result.scalar_one_or_none()
    if protocol is None:
        raise HTTPException(status_code=404, detail="Protocol not found")

    target_date, _user_tz = resolve_user_date(data.date, current_user.timezone)
    schedule_context = await load_regimen_schedule_context(current_user)

    individual_request = AdherenceUpdateRequest(
        status=data.status, date=data.date, skip_reason=data.skip_reason
    )

    items_marked: list[BatchAdherenceItemResult] = []
    items_not_due: list[str] = []
    therapies_to_update: list[tuple] = []

    for protocol_item in protocol.items:
        resolved = _resolve_protocol_item(protocol_item)
        if resolved is None:
            continue

        item_type, user_item, item_name, dosage_snapshot, settings_snapshot = resolved

        if not user_item.is_active:
            items_not_due.append(item_name)
            continue

        if not is_regimen_item_scheduled_for_date(
            schedule_context, item_type=item_type, item=user_item, target_date=target_date
        ):
            items_not_due.append(item_name)
            continue

        regimes_snapshot = adherence_regime_snapshot_for_item(
            schedule_context, item_type=item_type, item=user_item, target_date=target_date
        )

        adherence_result = await _upsert_adherence(
            item_type=item_type,
            item_id=user_item.id,
            take_window=user_item.take_window,
            item_name_snapshot=item_name,
            regimes_snapshot=regimes_snapshot,
            dosage_snapshot=dosage_snapshot,
            settings_snapshot=settings_snapshot,
            current_user=current_user,
            data=individual_request,
            session=session,
        )

        items_marked.append(
            BatchAdherenceItemResult(
                item_id=adherence_result.item_id,
                item_type=item_type,
                item_name=item_name,
                status=data.status,
                scheduled_at=adherence_result.scheduled_at,
                taken_at=adherence_result.taken_at,
                skip_reason=adherence_result.skip_reason,
            )
        )

        if item_type == "therapy" and data.status == "taken" and adherence_result.taken_at is not None:
            therapies_to_update.append((user_item, adherence_result.taken_at))

    for user_therapy, taken_at in therapies_to_update:
        next_settings = dict(user_therapy.settings or {})
        next_settings["last_completed_at"] = taken_at.isoformat()
        user_therapy.settings = next_settings

    if therapies_to_update:
        await session.commit()

    if not items_marked:
        raise HTTPException(status_code=400, detail="No items in this protocol are scheduled for that date")

    return BatchAdherenceResponse(
        protocol_id=str(protocol.id),
        protocol_name=protocol.name,
        date=target_date,
        status=data.status,
        items_marked=items_marked,
        items_not_due=items_not_due,
    )
