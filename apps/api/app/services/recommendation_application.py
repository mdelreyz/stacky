import uuid
from dataclasses import dataclass, field
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medication import Medication
from app.models.peptide import Peptide
from app.models.protocol import Protocol, ProtocolItem
from app.models.therapy import Therapy
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.schemas.user_preferences import (
    AppliedItem,
    ApplyRecommendationItem,
    ApplyRecommendationsResponse,
)
from app.services.supplement_visibility import get_visible_supplement

_DEFAULT_DOSAGES = {
    "supplement": (1.0, "capsule"),
    "medication": (1.0, "tablet"),
    "therapy": (20.0, "minutes"),
    "peptide": (0.1, "mg"),
}

_DEFAULT_WINDOWS = {
    "supplement": "morning_with_food",
    "medication": "evening",
    "therapy": "afternoon",
    "peptide": "morning_fasted",
}


@dataclass
class _AppliedUserItemIds:
    supplements: list[uuid.UUID] = field(default_factory=list)
    medications: list[uuid.UUID] = field(default_factory=list)
    therapies: list[uuid.UUID] = field(default_factory=list)
    peptides: list[uuid.UUID] = field(default_factory=list)


def _resolve_defaults(item: ApplyRecommendationItem) -> tuple[float, str, str, str]:
    default_amount, default_unit = _DEFAULT_DOSAGES.get(item.item_type, (1.0, "unit"))
    dosage_amount = item.dosage_amount or default_amount
    dosage_unit = item.dosage_unit or default_unit
    take_window = item.take_window or _DEFAULT_WINDOWS.get(item.item_type, "morning_with_food")
    frequency = item.frequency or "daily"
    return dosage_amount, dosage_unit, take_window, frequency


async def _apply_supplement(
    session: AsyncSession,
    user_id: uuid.UUID,
    item: ApplyRecommendationItem,
    started_at: date,
    applied_ids: _AppliedUserItemIds,
) -> AppliedItem | None:
    dosage_amount, dosage_unit, take_window, frequency = _resolve_defaults(item)
    catalog_item = await get_visible_supplement(session, item.catalog_id, user_id)
    if catalog_item is None:
        raise HTTPException(status_code=400, detail=f"Supplement {item.catalog_id} not found")

    duplicate = await session.execute(
        select(UserSupplement).where(
            UserSupplement.user_id == user_id,
            UserSupplement.supplement_id == item.catalog_id,
            UserSupplement.is_active.is_(True),
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        return None

    user_item = UserSupplement(
        user_id=user_id,
        supplement_id=item.catalog_id,
        dosage_amount=dosage_amount,
        dosage_unit=dosage_unit,
        frequency=frequency,
        take_window=take_window,
        with_food="with_food" in take_window,
        started_at=started_at,
    )
    session.add(user_item)
    await session.flush()
    applied_ids.supplements.append(user_item.id)
    return AppliedItem(
        user_item_id=str(user_item.id),
        item_type="supplement",
        catalog_id=str(item.catalog_id),
        name=catalog_item.name,
    )


async def _apply_medication(
    session: AsyncSession,
    user_id: uuid.UUID,
    item: ApplyRecommendationItem,
    started_at: date,
    applied_ids: _AppliedUserItemIds,
) -> AppliedItem | None:
    dosage_amount, dosage_unit, take_window, frequency = _resolve_defaults(item)
    result = await session.execute(select(Medication).where(Medication.id == item.catalog_id))
    catalog_item = result.scalar_one_or_none()
    if catalog_item is None:
        raise HTTPException(status_code=400, detail=f"Medication {item.catalog_id} not found")

    duplicate = await session.execute(
        select(UserMedication).where(
            UserMedication.user_id == user_id,
            UserMedication.medication_id == item.catalog_id,
            UserMedication.is_active.is_(True),
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        return None

    user_item = UserMedication(
        user_id=user_id,
        medication_id=item.catalog_id,
        dosage_amount=dosage_amount,
        dosage_unit=dosage_unit,
        frequency=frequency,
        take_window=take_window,
        started_at=started_at,
    )
    session.add(user_item)
    await session.flush()
    applied_ids.medications.append(user_item.id)
    return AppliedItem(
        user_item_id=str(user_item.id),
        item_type="medication",
        catalog_id=str(item.catalog_id),
        name=catalog_item.name,
    )


async def _apply_therapy(
    session: AsyncSession,
    user_id: uuid.UUID,
    item: ApplyRecommendationItem,
    started_at: date,
    applied_ids: _AppliedUserItemIds,
) -> AppliedItem | None:
    dosage_amount, _dosage_unit, take_window, frequency = _resolve_defaults(item)
    result = await session.execute(select(Therapy).where(Therapy.id == item.catalog_id))
    catalog_item = result.scalar_one_or_none()
    if catalog_item is None:
        raise HTTPException(status_code=400, detail=f"Therapy {item.catalog_id} not found")

    duplicate = await session.execute(
        select(UserTherapy).where(
            UserTherapy.user_id == user_id,
            UserTherapy.therapy_id == item.catalog_id,
            UserTherapy.is_active.is_(True),
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        return None

    user_item = UserTherapy(
        user_id=user_id,
        therapy_id=item.catalog_id,
        duration_minutes=int(dosage_amount),
        frequency=frequency,
        take_window=take_window,
        started_at=started_at,
    )
    session.add(user_item)
    await session.flush()
    applied_ids.therapies.append(user_item.id)
    return AppliedItem(
        user_item_id=str(user_item.id),
        item_type="therapy",
        catalog_id=str(item.catalog_id),
        name=catalog_item.name,
    )


async def _apply_peptide(
    session: AsyncSession,
    user_id: uuid.UUID,
    item: ApplyRecommendationItem,
    started_at: date,
    applied_ids: _AppliedUserItemIds,
) -> AppliedItem | None:
    dosage_amount, dosage_unit, take_window, frequency = _resolve_defaults(item)
    result = await session.execute(select(Peptide).where(Peptide.id == item.catalog_id))
    catalog_item = result.scalar_one_or_none()
    if catalog_item is None:
        raise HTTPException(status_code=400, detail=f"Peptide {item.catalog_id} not found")

    duplicate = await session.execute(
        select(UserPeptide).where(
            UserPeptide.user_id == user_id,
            UserPeptide.peptide_id == item.catalog_id,
            UserPeptide.is_active.is_(True),
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        return None

    user_item = UserPeptide(
        user_id=user_id,
        peptide_id=item.catalog_id,
        dosage_amount=dosage_amount,
        dosage_unit=dosage_unit,
        frequency=frequency,
        take_window=take_window,
        started_at=started_at,
    )
    session.add(user_item)
    await session.flush()
    applied_ids.peptides.append(user_item.id)
    return AppliedItem(
        user_item_id=str(user_item.id),
        item_type="peptide",
        catalog_id=str(item.catalog_id),
        name=catalog_item.name,
    )


async def _create_protocol(
    session: AsyncSession,
    user_id: uuid.UUID,
    protocol_name: str,
    applied_ids: _AppliedUserItemIds,
) -> str:
    protocol = Protocol(user_id=user_id, name=protocol_name)
    session.add(protocol)
    await session.flush()

    sort_order = 0
    for user_item_id in applied_ids.supplements:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="supplement",
                user_supplement_id=user_item_id,
                sort_order=sort_order,
            )
        )
        sort_order += 1
    for user_item_id in applied_ids.medications:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="medication",
                user_medication_id=user_item_id,
                sort_order=sort_order,
            )
        )
        sort_order += 1
    for user_item_id in applied_ids.therapies:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="therapy",
                user_therapy_id=user_item_id,
                sort_order=sort_order,
            )
        )
        sort_order += 1
    for user_item_id in applied_ids.peptides:
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="peptide",
                user_peptide_id=user_item_id,
                sort_order=sort_order,
            )
        )
        sort_order += 1

    return str(protocol.id)


async def apply_recommendations_to_user(
    session: AsyncSession,
    user_id: uuid.UUID,
    items: list[ApplyRecommendationItem],
    protocol_name: str | None,
    started_at_value: str | None,
) -> ApplyRecommendationsResponse:
    today = date.today()
    started_at = date.fromisoformat(started_at_value) if started_at_value else today

    applied: list[AppliedItem] = []
    applied_ids = _AppliedUserItemIds()

    for item in items:
        applied_item: AppliedItem | None
        if item.item_type == "supplement":
            applied_item = await _apply_supplement(session, user_id, item, started_at, applied_ids)
        elif item.item_type == "medication":
            applied_item = await _apply_medication(session, user_id, item, started_at, applied_ids)
        elif item.item_type == "therapy":
            applied_item = await _apply_therapy(session, user_id, item, started_at, applied_ids)
        else:
            applied_item = await _apply_peptide(session, user_id, item, started_at, applied_ids)

        if applied_item is not None:
            applied.append(applied_item)

    if not applied:
        raise HTTPException(status_code=400, detail="All recommended items are already in your active regimen")

    protocol_id = None
    if protocol_name:
        protocol_id = await _create_protocol(session, user_id, protocol_name, applied_ids)

    await session.commit()

    return ApplyRecommendationsResponse(
        applied=applied,
        protocol_id=protocol_id,
        protocol_name=protocol_name,
    )
