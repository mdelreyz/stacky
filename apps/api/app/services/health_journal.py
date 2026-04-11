"""Health journal service — CRUD and summary statistics."""

from collections import Counter
from datetime import date
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_journal import HealthJournalEntry


async def get_journal_entry(
    session: AsyncSession,
    user_id: UUID,
    entry_id: UUID,
) -> HealthJournalEntry | None:
    result = await session.execute(
        select(HealthJournalEntry).where(
            HealthJournalEntry.id == entry_id,
            HealthJournalEntry.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_journal_entry_by_date(
    session: AsyncSession,
    user_id: UUID,
    entry_date: date,
) -> HealthJournalEntry | None:
    result = await session.execute(
        select(HealthJournalEntry).where(
            HealthJournalEntry.user_id == user_id,
            HealthJournalEntry.entry_date == entry_date,
        )
    )
    return result.scalar_one_or_none()


async def list_journal_entries(
    session: AsyncSession,
    user_id: UUID,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 30,
    offset: int = 0,
) -> tuple[list[HealthJournalEntry], bool]:
    """List journal entries ordered by date descending. Returns (entries, has_more)."""
    query = select(HealthJournalEntry).where(HealthJournalEntry.user_id == user_id)

    if start_date:
        query = query.where(HealthJournalEntry.entry_date >= start_date)
    if end_date:
        query = query.where(HealthJournalEntry.entry_date <= end_date)

    query = query.order_by(HealthJournalEntry.entry_date.desc())
    query = query.offset(offset).limit(limit + 1)

    result = await session.execute(query)
    entries = list(result.scalars().all())

    has_more = len(entries) > limit
    if has_more:
        entries = entries[:limit]

    return entries, has_more


async def upsert_journal_entry(
    session: AsyncSession,
    user_id: UUID,
    entry_date: date,
    data: dict,
) -> HealthJournalEntry:
    """Create or update a journal entry for a given date (one entry per user per day)."""
    existing = await get_journal_entry_by_date(session, user_id, entry_date)

    if existing:
        for key, value in data.items():
            if hasattr(existing, key):
                setattr(existing, key, value)
        await session.flush()
        await session.refresh(existing)
        return existing

    entry = HealthJournalEntry(
        user_id=user_id,
        entry_date=entry_date,
        **data,
    )
    session.add(entry)
    await session.flush()
    await session.refresh(entry)
    return entry


async def update_journal_entry(
    session: AsyncSession,
    entry: HealthJournalEntry,
    data: dict,
) -> HealthJournalEntry:
    for key, value in data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    await session.flush()
    await session.refresh(entry)
    return entry


async def delete_journal_entry(
    session: AsyncSession,
    entry: HealthJournalEntry,
) -> None:
    await session.delete(entry)
    await session.flush()


async def compute_journal_summary(
    session: AsyncSession,
    user_id: UUID,
    start_date: date,
    end_date: date,
) -> dict:
    """Compute summary stats for a date range."""
    result = await session.execute(
        select(HealthJournalEntry).where(
            HealthJournalEntry.user_id == user_id,
            HealthJournalEntry.entry_date >= start_date,
            HealthJournalEntry.entry_date <= end_date,
        ).order_by(HealthJournalEntry.entry_date.asc())
    )
    entries = list(result.scalars().all())

    if not entries:
        return {
            "start_date": start_date,
            "end_date": end_date,
            "entry_count": 0,
            "avg_energy": None,
            "avg_mood": None,
            "avg_sleep": None,
            "avg_stress": None,
            "symptom_frequency": {},
            "trend_energy": [],
            "trend_mood": [],
            "trend_sleep": [],
        }

    energy_vals = [e.energy_level for e in entries if e.energy_level is not None]
    mood_vals = [e.mood_level for e in entries if e.mood_level is not None]
    sleep_vals = [e.sleep_quality for e in entries if e.sleep_quality is not None]
    stress_vals = [e.stress_level for e in entries if e.stress_level is not None]

    symptom_counter: Counter[str] = Counter()
    for entry in entries:
        if entry.symptoms:
            for symptom in entry.symptoms:
                symptom_counter[symptom] += 1

    def _avg(vals: list[int]) -> float | None:
        return round(sum(vals) / len(vals), 1) if vals else None

    def _trend(entries: list[HealthJournalEntry], field: str) -> list[dict]:
        points = []
        for e in entries:
            val = getattr(e, field)
            if val is not None:
                points.append({"date": e.entry_date.isoformat(), "value": val})
        return points

    return {
        "start_date": start_date,
        "end_date": end_date,
        "entry_count": len(entries),
        "avg_energy": _avg(energy_vals),
        "avg_mood": _avg(mood_vals),
        "avg_sleep": _avg(sleep_vals),
        "avg_stress": _avg(stress_vals),
        "symptom_frequency": dict(symptom_counter.most_common()),
        "trend_energy": _trend(entries, "energy_level"),
        "trend_mood": _trend(entries, "mood_level"),
        "trend_sleep": _trend(entries, "sleep_quality"),
    }
