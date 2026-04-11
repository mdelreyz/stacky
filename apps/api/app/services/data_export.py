"""Data export services — generates CSV exports of user health data."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.adherence import AdherenceLog


async def export_adherence_csv(
    session: AsyncSession,
    user_id,
    start_date: date | None = None,
    end_date: date | None = None,
) -> str:
    """Export adherence history as CSV string."""
    query = (
        select(AdherenceLog)
        .where(AdherenceLog.user_id == user_id)
        .order_by(AdherenceLog.scheduled_at.desc())
    )

    if start_date:
        query = query.where(AdherenceLog.scheduled_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(AdherenceLog.scheduled_at <= datetime.combine(end_date, datetime.max.time()))

    result = await session.execute(query)
    logs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date",
        "item_type",
        "item_name",
        "take_window",
        "status",
        "taken_at",
        "skip_reason",
        "dosage",
        "protocols",
    ])

    for log in logs:
        status = "skipped" if log.skipped else ("taken" if log.taken_at else "pending")
        dosage_str = ""
        if log.dosage_snapshot:
            amount = log.dosage_snapshot.get("amount", "")
            unit = log.dosage_snapshot.get("unit", "")
            dosage_str = f"{amount} {unit}".strip()

        protocols_str = ", ".join(log.regimes_snapshot or [])

        writer.writerow([
            log.scheduled_at.strftime("%Y-%m-%d") if log.scheduled_at else "",
            log.item_type or "",
            log.item_name_snapshot or "",
            log.take_window_snapshot or "",
            status,
            log.taken_at.isoformat() if log.taken_at else "",
            log.skip_reason or "",
            dosage_str,
            protocols_str,
        ])

    return output.getvalue()


async def export_stack_csv(
    session: AsyncSession,
    user_id,
) -> str:
    """Export current active stack (all user items) as CSV."""
    from app.models.user_supplement import UserSupplement
    from app.models.user_medication import UserMedication
    from app.models.user_therapy import UserTherapy
    from app.models.user_peptide import UserPeptide
    from app.models.supplement import Supplement
    from app.models.medication import Medication
    from app.models.therapy import Therapy
    from app.models.peptide import Peptide
    from sqlalchemy.orm import selectinload

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "type",
        "name",
        "dosage",
        "frequency",
        "take_window",
        "is_active",
        "started_at",
        "notes",
    ])

    # Supplements
    result = await session.execute(
        select(UserSupplement)
        .where(UserSupplement.user_id == user_id)
        .options(selectinload(UserSupplement.supplement))
    )
    for item in result.scalars().all():
        name = item.supplement.name if item.supplement else "Unknown"
        writer.writerow([
            "supplement",
            name,
            f"{item.dosage_amount} {item.dosage_unit}",
            item.frequency.value if item.frequency else "",
            item.take_window.value if item.take_window else "",
            item.is_active,
            str(item.started_at) if item.started_at else "",
            item.notes or "",
        ])

    # Medications
    result = await session.execute(
        select(UserMedication)
        .where(UserMedication.user_id == user_id)
        .options(selectinload(UserMedication.medication))
    )
    for item in result.scalars().all():
        name = item.medication.name if item.medication else "Unknown"
        writer.writerow([
            "medication",
            name,
            f"{item.dosage_amount} {item.dosage_unit}",
            item.frequency.value if item.frequency else "",
            item.take_window.value if item.take_window else "",
            item.is_active,
            str(item.started_at) if item.started_at else "",
            item.notes or "",
        ])

    # Therapies
    result = await session.execute(
        select(UserTherapy)
        .where(UserTherapy.user_id == user_id)
        .options(selectinload(UserTherapy.therapy))
    )
    for item in result.scalars().all():
        name = item.therapy.name if item.therapy else "Unknown"
        writer.writerow([
            "therapy",
            name,
            f"{item.duration_minutes} min",
            item.frequency.value if item.frequency else "",
            "",
            item.is_active,
            str(item.started_at) if item.started_at else "",
            item.notes or "",
        ])

    # Peptides
    result = await session.execute(
        select(UserPeptide)
        .where(UserPeptide.user_id == user_id)
        .options(selectinload(UserPeptide.peptide))
    )
    for item in result.scalars().all():
        name = item.peptide.name if item.peptide else "Unknown"
        writer.writerow([
            "peptide",
            name,
            f"{item.dosage_amount} {item.dosage_unit}",
            item.frequency.value if item.frequency else "",
            item.take_window.value if item.take_window else "",
            item.is_active,
            str(item.started_at) if item.started_at else "",
            item.notes or "",
        ])

    return output.getvalue()


async def export_journal_csv(
    session: AsyncSession,
    user_id,
    start_date: date | None = None,
    end_date: date | None = None,
) -> str:
    """Export health journal entries as CSV string."""
    from app.models.health_journal import HealthJournalEntry

    query = (
        select(HealthJournalEntry)
        .where(HealthJournalEntry.user_id == user_id)
        .order_by(HealthJournalEntry.entry_date.desc())
    )

    if start_date:
        query = query.where(HealthJournalEntry.entry_date >= start_date)
    if end_date:
        query = query.where(HealthJournalEntry.entry_date <= end_date)

    result = await session.execute(query)
    entries = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date",
        "energy",
        "mood",
        "sleep",
        "stress",
        "symptoms",
        "notes",
    ])

    for entry in entries:
        symptoms_str = ", ".join(entry.symptoms) if entry.symptoms else ""
        writer.writerow([
            str(entry.entry_date),
            entry.energy_level if entry.energy_level is not None else "",
            entry.mood_level if entry.mood_level is not None else "",
            entry.sleep_quality if entry.sleep_quality is not None else "",
            entry.stress_level if entry.stress_level is not None else "",
            symptoms_str,
            entry.notes or "",
        ])

    return output.getvalue()
