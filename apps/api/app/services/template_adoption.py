"""Template adoption — creates user items and a protocol from a template blueprint."""

from __future__ import annotations

import logging
import re
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import Frequency, TakeWindow, normalize_take_window
from app.models.medication import Medication
from app.models.peptide import Peptide
from app.models.protocol import Protocol, ProtocolItem
from app.models.protocol_template import ProtocolTemplate
from app.models.supplement import Supplement
from app.models.therapy import Therapy
from app.models.user_medication import UserMedication
from app.models.user_peptide import UserPeptide
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy

logger = logging.getLogger(__name__)


def _parse_dosage(dosage_str: str | None) -> tuple[float, str]:
    """Parse a dosage string like '5000 IU' into (amount, unit)."""
    if not dosage_str:
        return (1.0, "unit")
    match = re.match(r"([0-9.,]+)\s*(.*)", dosage_str.strip())
    if not match:
        return (1.0, dosage_str.strip() or "unit")
    amount_str = match.group(1).replace(",", "")
    unit = match.group(2).strip() or "unit"
    try:
        amount = float(amount_str)
    except ValueError:
        amount = 1.0
    return (amount, unit)


def _parse_frequency(value: str | None) -> str:
    if not value:
        return Frequency.daily.value
    try:
        return Frequency(value).value
    except ValueError:
        return Frequency.daily.value


def _parse_take_window(value: str | None) -> str:
    if not value:
        return TakeWindow.morning_with_food.value
    result = normalize_take_window(value, fallback=TakeWindow.morning_with_food)
    return result.value if result else TakeWindow.morning_with_food.value


async def adopt_template(
    session: AsyncSession,
    user_id: uuid.UUID,
    template: ProtocolTemplate,
) -> dict:
    """Adopt a protocol template — creates user items for missing catalog items and assembles a protocol."""
    if not template.items:
        return {
            "protocol_id": None,
            "protocol_name": template.name,
            "items_created": 0,
            "items_existing": 0,
            "message": "Template has no items",
        }

    items_created = 0
    items_existing = 0
    protocol_items: list[dict] = []  # {item_type, user_item_id}

    for idx, blueprint in enumerate(template.items):
        item_type = blueprint.get("type", "supplement")
        catalog_name = blueprint.get("catalog_name", "")
        dosage = blueprint.get("dosage")
        take_window = _parse_take_window(blueprint.get("take_window"))
        frequency = _parse_frequency(blueprint.get("frequency"))

        if item_type == "supplement":
            user_item_id = await _ensure_user_supplement(
                session, user_id, catalog_name, dosage, take_window, frequency
            )
            if user_item_id:
                key = "user_supplement_id"
            else:
                continue
        elif item_type == "medication":
            user_item_id = await _ensure_user_medication(
                session, user_id, catalog_name, dosage, take_window, frequency
            )
            if user_item_id:
                key = "user_medication_id"
            else:
                continue
        elif item_type == "therapy":
            user_item_id = await _ensure_user_therapy(
                session, user_id, catalog_name, frequency
            )
            if user_item_id:
                key = "user_therapy_id"
            else:
                continue
        elif item_type == "peptide":
            user_item_id = await _ensure_user_peptide(
                session, user_id, catalog_name, dosage, take_window, frequency
            )
            if user_item_id:
                key = "user_peptide_id"
            else:
                continue
        else:
            continue

        if user_item_id[1]:  # newly created
            items_created += 1
        else:
            items_existing += 1

        protocol_items.append({
            "item_type": item_type,
            "id_column": key,
            "user_item_id": user_item_id[0],
            "sort_order": idx,
        })

    # Create the protocol
    protocol = Protocol(
        user_id=user_id,
        name=template.name,
        description=template.description,
    )
    session.add(protocol)
    await session.flush()

    for pi in protocol_items:
        item = ProtocolItem(
            protocol_id=protocol.id,
            item_type=pi["item_type"],
            sort_order=pi["sort_order"],
        )
        setattr(item, pi["id_column"], pi["user_item_id"])
        session.add(item)

    # Increment adoption count
    template.adoption_count = (template.adoption_count or 0) + 1

    await session.commit()

    return {
        "protocol_id": protocol.id,
        "protocol_name": protocol.name,
        "items_created": items_created,
        "items_existing": items_existing,
        "message": f"Protocol '{protocol.name}' created with {len(protocol_items)} items",
    }


async def _ensure_user_supplement(
    session: AsyncSession,
    user_id: uuid.UUID,
    catalog_name: str,
    dosage: str | None,
    take_window: str,
    frequency: str,
) -> tuple[uuid.UUID, bool] | None:
    """Find or create a user supplement. Returns (id, is_new) or None if catalog item not found."""
    # Find catalog item by name (case-insensitive)
    result = await session.execute(
        select(Supplement).where(func.lower(Supplement.name) == catalog_name.lower())
    )
    catalog = result.scalar_one_or_none()
    if not catalog:
        logger.warning("Template adoption: supplement '%s' not found in catalog", catalog_name)
        return None

    # Check if user already has this supplement
    existing = await session.execute(
        select(UserSupplement).where(
            UserSupplement.user_id == user_id,
            UserSupplement.supplement_id == catalog.id,
        )
    )
    user_item = existing.scalar_one_or_none()
    if user_item:
        return (user_item.id, False)

    # Create new user supplement
    amount, unit = _parse_dosage(dosage)
    new = UserSupplement(
        user_id=user_id,
        supplement_id=catalog.id,
        dosage_amount=amount,
        dosage_unit=unit,
        take_window=take_window,
        frequency=frequency,
        started_at=date.today(),
    )
    session.add(new)
    await session.flush()
    return (new.id, True)


async def _ensure_user_medication(
    session: AsyncSession,
    user_id: uuid.UUID,
    catalog_name: str,
    dosage: str | None,
    take_window: str,
    frequency: str,
) -> tuple[uuid.UUID, bool] | None:
    result = await session.execute(
        select(Medication).where(func.lower(Medication.name) == catalog_name.lower())
    )
    catalog = result.scalar_one_or_none()
    if not catalog:
        logger.warning("Template adoption: medication '%s' not found in catalog", catalog_name)
        return None

    existing = await session.execute(
        select(UserMedication).where(
            UserMedication.user_id == user_id,
            UserMedication.medication_id == catalog.id,
        )
    )
    user_item = existing.scalar_one_or_none()
    if user_item:
        return (user_item.id, False)

    amount, unit = _parse_dosage(dosage)
    new = UserMedication(
        user_id=user_id,
        medication_id=catalog.id,
        dosage_amount=amount,
        dosage_unit=unit,
        take_window=take_window,
        frequency=frequency,
        started_at=date.today(),
    )
    session.add(new)
    await session.flush()
    return (new.id, True)


async def _ensure_user_therapy(
    session: AsyncSession,
    user_id: uuid.UUID,
    catalog_name: str,
    frequency: str,
) -> tuple[uuid.UUID, bool] | None:
    result = await session.execute(
        select(Therapy).where(func.lower(Therapy.name) == catalog_name.lower())
    )
    catalog = result.scalar_one_or_none()
    if not catalog:
        logger.warning("Template adoption: therapy '%s' not found in catalog", catalog_name)
        return None

    existing = await session.execute(
        select(UserTherapy).where(
            UserTherapy.user_id == user_id,
            UserTherapy.therapy_id == catalog.id,
        )
    )
    user_item = existing.scalar_one_or_none()
    if user_item:
        return (user_item.id, False)

    new = UserTherapy(
        user_id=user_id,
        therapy_id=catalog.id,
        frequency=frequency,
        duration_minutes=30,
        started_at=date.today(),
    )
    session.add(new)
    await session.flush()
    return (new.id, True)


async def _ensure_user_peptide(
    session: AsyncSession,
    user_id: uuid.UUID,
    catalog_name: str,
    dosage: str | None,
    take_window: str,
    frequency: str,
) -> tuple[uuid.UUID, bool] | None:
    result = await session.execute(
        select(Peptide).where(func.lower(Peptide.name) == catalog_name.lower())
    )
    catalog = result.scalar_one_or_none()
    if not catalog:
        logger.warning("Template adoption: peptide '%s' not found in catalog", catalog_name)
        return None

    existing = await session.execute(
        select(UserPeptide).where(
            UserPeptide.user_id == user_id,
            UserPeptide.peptide_id == catalog.id,
        )
    )
    user_item = existing.scalar_one_or_none()
    if user_item:
        return (user_item.id, False)

    amount, unit = _parse_dosage(dosage)
    new = UserPeptide(
        user_id=user_id,
        peptide_id=catalog.id,
        dosage_amount=amount,
        dosage_unit=unit,
        take_window=take_window,
        frequency=frequency,
        started_at=date.today(),
    )
    session.add(new)
    await session.flush()
    return (new.id, True)
