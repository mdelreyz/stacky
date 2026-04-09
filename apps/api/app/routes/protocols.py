import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_session
from app.models.protocol import Protocol, ProtocolItem
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.schemas.common import PaginatedResponse
from app.schemas.protocol import (
    ProtocolCreate,
    ProtocolItemResponse,
    ProtocolResponse,
    ProtocolScheduleResponse,
    ProtocolUpdate,
)
from app.services.pagination import paginate, paginated_response
from app.services.protocol_schedule import (
    protocol_is_currently_active,
    protocol_schedule_payload,
    protocol_schedule_summary,
)
from app.services.user_medication_serialization import serialize_user_medication
from app.services.user_peptide_serialization import serialize_user_peptide
from app.services.user_supplement_serialization import serialize_user_supplement
from app.services.user_therapy_serialization import serialize_user_therapy

router = APIRouter(prefix="/users/me/protocols", tags=["protocols"])


def _dedupe_ids(ids: list[uuid.UUID], item_label: str) -> list[uuid.UUID]:
    ordered: list[uuid.UUID] = []
    seen: set[uuid.UUID] = set()
    for item_id in ids:
        if item_id in seen:
            raise HTTPException(status_code=400, detail=f"Protocol cannot contain duplicate {item_label}")
        seen.add(item_id)
        ordered.append(item_id)
    return ordered


async def _serialize_protocol(protocol: Protocol, *, timezone_name: str | None) -> ProtocolResponse:
    items: list[ProtocolItemResponse] = []
    for item in protocol.items:
        items.append(
            ProtocolItemResponse(
                id=item.id,
                item_type=item.item_type,
                user_supplement=await serialize_user_supplement(item.user_supplement),
                user_medication=await serialize_user_medication(item.user_medication),
                user_therapy=await serialize_user_therapy(item.user_therapy),
                user_peptide=await serialize_user_peptide(item.user_peptide),
                sort_order=item.sort_order,
            )
        )

    schedule_payload = protocol_schedule_payload(protocol)
    return ProtocolResponse(
        id=protocol.id,
        name=protocol.name,
        description=protocol.description,
        is_active=protocol.is_active,
        schedule=ProtocolScheduleResponse.model_validate(schedule_payload) if schedule_payload is not None else None,
        schedule_summary=protocol_schedule_summary(protocol),
        is_currently_active=protocol_is_currently_active(protocol, timezone_name=timezone_name),
        items=items,
        created_at=protocol.created_at,
    )


def _protocol_query_for_user(user_id: uuid.UUID):
    return (
        select(Protocol)
        .where(Protocol.user_id == user_id)
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


async def _resolve_user_supplements(
    session: AsyncSession,
    current_user: User,
    user_supplement_ids: list[uuid.UUID],
) -> list[UserSupplement]:
    ordered_ids = _dedupe_ids(user_supplement_ids, "supplements")
    result = await session.execute(
        select(UserSupplement)
        .where(
            UserSupplement.user_id == current_user.id,
            UserSupplement.id.in_(ordered_ids),
        )
        .options(selectinload(UserSupplement.supplement))
    )
    user_supplements = list(result.scalars().all())
    supplements_by_id = {user_supplement.id: user_supplement for user_supplement in user_supplements}

    missing_ids = [item_id for item_id in ordered_ids if item_id not in supplements_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail="Protocol items must reference supplements, medications, or therapies in your account",
        )

    return [supplements_by_id[item_id] for item_id in ordered_ids]


async def _resolve_user_therapies(
    session: AsyncSession,
    current_user: User,
    user_therapy_ids: list[uuid.UUID],
) -> list[UserTherapy]:
    ordered_ids = _dedupe_ids(user_therapy_ids, "therapies")
    result = await session.execute(
        select(UserTherapy)
        .where(
            UserTherapy.user_id == current_user.id,
            UserTherapy.id.in_(ordered_ids),
        )
        .options(selectinload(UserTherapy.therapy))
    )
    user_therapies = list(result.scalars().all())
    therapies_by_id = {user_therapy.id: user_therapy for user_therapy in user_therapies}

    missing_ids = [item_id for item_id in ordered_ids if item_id not in therapies_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail="Protocol items must reference supplements or therapies in your account",
        )

    return [therapies_by_id[item_id] for item_id in ordered_ids]


async def _resolve_user_medications(
    session: AsyncSession,
    current_user: User,
    user_medication_ids: list[uuid.UUID],
) -> list[UserMedication]:
    ordered_ids = _dedupe_ids(user_medication_ids, "medications")
    result = await session.execute(
        select(UserMedication)
        .where(
            UserMedication.user_id == current_user.id,
            UserMedication.id.in_(ordered_ids),
        )
        .options(selectinload(UserMedication.medication))
    )
    user_medications = list(result.scalars().all())
    medications_by_id = {user_medication.id: user_medication for user_medication in user_medications}

    missing_ids = [item_id for item_id in ordered_ids if item_id not in medications_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail="Protocol items must reference supplements, medications, or therapies in your account",
        )

    return [medications_by_id[item_id] for item_id in ordered_ids]


async def _resolve_user_peptides(
    session: AsyncSession,
    current_user: User,
    user_peptide_ids: list[uuid.UUID],
) -> list[UserPeptide]:
    ordered_ids = _dedupe_ids(user_peptide_ids, "peptides")
    result = await session.execute(
        select(UserPeptide)
        .where(
            UserPeptide.user_id == current_user.id,
            UserPeptide.id.in_(ordered_ids),
        )
        .options(selectinload(UserPeptide.peptide))
    )
    user_peptides = list(result.scalars().all())
    peptides_by_id = {user_peptide.id: user_peptide for user_peptide in user_peptides}

    missing_ids = [item_id for item_id in ordered_ids if item_id not in peptides_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail="Protocol items must reference items in your account",
        )

    return [peptides_by_id[item_id] for item_id in ordered_ids]


async def _replace_protocol_items(
    session: AsyncSession,
    protocol: Protocol,
    user_supplement_ids: list[uuid.UUID],
    user_medication_ids: list[uuid.UUID],
    user_therapy_ids: list[uuid.UUID],
    user_peptide_ids: list[uuid.UUID],
    current_user: User,
) -> None:
    user_supplements = await _resolve_user_supplements(session, current_user, user_supplement_ids)
    user_medications = await _resolve_user_medications(session, current_user, user_medication_ids)
    user_therapies = await _resolve_user_therapies(session, current_user, user_therapy_ids)
    user_peptides = await _resolve_user_peptides(session, current_user, user_peptide_ids)

    await session.execute(delete(ProtocolItem).where(ProtocolItem.protocol_id == protocol.id))

    sort_idx = 0
    for user_supplement in user_supplements:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="supplement",
                user_supplement_id=user_supplement.id,
                sort_order=sort_idx,
            )
        )
        sort_idx += 1
    for user_medication in user_medications:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="medication",
                user_medication_id=user_medication.id,
                sort_order=sort_idx,
            )
        )
        sort_idx += 1
    for user_therapy in user_therapies:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="therapy",
                user_therapy_id=user_therapy.id,
                sort_order=sort_idx,
            )
        )
        sort_idx += 1
    for user_peptide in user_peptides:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="peptide",
                user_peptide_id=user_peptide.id,
                sort_order=sort_idx,
            )
        )
        sort_idx += 1


def _apply_protocol_schedule(protocol: Protocol, schedule_data) -> None:
    if schedule_data is None:
        protocol.schedule_type = None
        protocol.manual_is_active = False
        protocol.schedule_start_date = None
        protocol.schedule_end_date = None
        protocol.weeks_of_month = None
        return

    protocol.schedule_type = schedule_data.type
    protocol.manual_is_active = bool(schedule_data.manual_is_active)
    protocol.schedule_start_date = schedule_data.start_date
    protocol.schedule_end_date = schedule_data.end_date
    protocol.weeks_of_month = list(schedule_data.weeks_of_month or []) or None


@router.get("", response_model=PaginatedResponse[ProtocolResponse])
async def list_protocols(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    query = _protocol_query_for_user(current_user.id).order_by(Protocol.created_at.desc())
    if active_only:
        query = query.where(Protocol.is_active.is_(True))

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[await _serialize_protocol(p, timezone_name=current_user.timezone) for p in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{protocol_id}", response_model=ProtocolResponse)
async def get_protocol(
    protocol_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol_id)
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    return await _serialize_protocol(protocol, timezone_name=current_user.timezone)


@router.post("", response_model=ProtocolResponse, status_code=201)
async def create_protocol(
    data: ProtocolCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not data.user_supplement_ids and not data.user_medication_ids and not data.user_therapy_ids and not data.user_peptide_ids:
        raise HTTPException(status_code=400, detail="Protocol must contain at least one item")

    protocol = Protocol(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
    )
    _apply_protocol_schedule(protocol, data.schedule)
    session.add(protocol)
    await session.flush()
    await _replace_protocol_items(
        session,
        protocol,
        data.user_supplement_ids,
        data.user_medication_ids,
        data.user_therapy_ids,
        data.user_peptide_ids,
        current_user,
    )
    await session.commit()

    result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol.id)
    )
    created_protocol = result.scalar_one()
    return await _serialize_protocol(created_protocol, timezone_name=current_user.timezone)


@router.patch("/{protocol_id}", response_model=ProtocolResponse)
async def update_protocol(
    protocol_id: uuid.UUID,
    data: ProtocolUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol_id)
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    update_data = data.model_dump(exclude_unset=True)
    user_supplement_ids = update_data.pop("user_supplement_ids", None)
    user_medication_ids = update_data.pop("user_medication_ids", None)
    user_therapy_ids = update_data.pop("user_therapy_ids", None)
    user_peptide_ids = update_data.pop("user_peptide_ids", None)
    update_data.pop("schedule", None)
    for key, value in update_data.items():
        setattr(protocol, key, value)

    if "schedule" in data.model_fields_set:
        _apply_protocol_schedule(protocol, data.schedule)

    any_items_changed = any(ids is not None for ids in [user_supplement_ids, user_medication_ids, user_therapy_ids, user_peptide_ids])
    if any_items_changed:
        resolved_user_supplement_ids = user_supplement_ids
        if resolved_user_supplement_ids is None:
            resolved_user_supplement_ids = [
                item.user_supplement_id
                for item in protocol.items
                if item.item_type == "supplement" and item.user_supplement_id is not None
            ]
        resolved_user_medication_ids = user_medication_ids
        if resolved_user_medication_ids is None:
            resolved_user_medication_ids = [
                item.user_medication_id
                for item in protocol.items
                if item.item_type == "medication" and item.user_medication_id is not None
            ]
        resolved_user_therapy_ids = user_therapy_ids
        if resolved_user_therapy_ids is None:
            resolved_user_therapy_ids = [
                item.user_therapy_id
                for item in protocol.items
                if item.item_type == "therapy" and item.user_therapy_id is not None
            ]
        resolved_user_peptide_ids = user_peptide_ids
        if resolved_user_peptide_ids is None:
            resolved_user_peptide_ids = [
                item.user_peptide_id
                for item in protocol.items
                if item.item_type == "peptide" and item.user_peptide_id is not None
            ]
        if not resolved_user_supplement_ids and not resolved_user_medication_ids and not resolved_user_therapy_ids and not resolved_user_peptide_ids:
            raise HTTPException(status_code=400, detail="Protocol must contain at least one item")
        await _replace_protocol_items(
            session,
            protocol,
            resolved_user_supplement_ids,
            resolved_user_medication_ids,
            resolved_user_therapy_ids,
            resolved_user_peptide_ids,
            current_user,
        )

    await session.commit()

    refreshed_result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol.id)
    )
    updated_protocol = refreshed_result.scalar_one()
    return await _serialize_protocol(updated_protocol, timezone_name=current_user.timezone)


@router.delete("/{protocol_id}", status_code=204)
async def delete_protocol(
    protocol_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Protocol).where(
            Protocol.id == protocol_id,
            Protocol.user_id == current_user.id,
        )
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    await session.delete(protocol)
    await session.commit()
