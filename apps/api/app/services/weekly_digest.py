"""Weekly digest — synthesizes adherence, journal, and exercise data for a week."""

from collections import Counter
from datetime import date, timedelta
from uuid import UUID

from datetime import datetime, time, timezone

from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.adherence import AdherenceLog
from app.models.health_journal import HealthJournalEntry
from app.models.workout_session import WorkoutSession


async def compute_weekly_digest(
    session: AsyncSession,
    user_id: UUID,
    week_end: date | None = None,
) -> dict:
    """Build a weekly digest for the 7 days ending on week_end (inclusive)."""
    if not week_end:
        week_end = date.today()
    week_start = week_end - timedelta(days=6)

    # Parallel queries
    adherence_result, journal_result, session_result = await _gather_data(
        session, user_id, week_start, week_end
    )

    # --- Adherence ---
    taken_count = sum(1 for log in adherence_result if log.taken_at is not None)
    skipped_count = sum(1 for log in adherence_result if log.skipped)
    total_logged = len(adherence_result)
    completion_rate = taken_count / total_logged if total_logged > 0 else 0.0

    # Per-day adherence
    day_taken: dict[str, int] = {}
    day_total: dict[str, int] = {}
    for log in adherence_result:
        d = log.scheduled_at.date().isoformat() if hasattr(log.scheduled_at, 'date') else str(log.scheduled_at)[:10]
        day_total[d] = day_total.get(d, 0) + 1
        if log.taken_at is not None:
            day_taken[d] = day_taken.get(d, 0) + 1

    daily_rates: list[dict] = []
    best_day = None
    worst_day = None
    best_rate = -1.0
    worst_rate = 2.0

    current = week_start
    while current <= week_end:
        d = current.isoformat()
        total = day_total.get(d, 0)
        taken = day_taken.get(d, 0)
        rate = taken / total if total > 0 else None
        daily_rates.append({"date": d, "taken": taken, "total": total, "rate": rate})

        if rate is not None:
            if rate > best_rate:
                best_rate = rate
                best_day = d
            if rate < worst_rate:
                worst_rate = rate
                worst_day = d

        current += timedelta(days=1)

    # --- Journal ---
    energy_vals = [e.energy_level for e in journal_result if e.energy_level is not None]
    mood_vals = [e.mood_level for e in journal_result if e.mood_level is not None]
    sleep_vals = [e.sleep_quality for e in journal_result if e.sleep_quality is not None]
    stress_vals = [e.stress_level for e in journal_result if e.stress_level is not None]

    symptom_counter: Counter[str] = Counter()
    for entry in journal_result:
        if entry.symptoms:
            for symptom in entry.symptoms:
                symptom_counter[symptom] += 1

    def _avg(vals: list[int]) -> float | None:
        return round(sum(vals) / len(vals), 1) if vals else None

    # --- Exercise ---
    exercise_sessions_count = len(session_result)
    total_sets = 0
    total_volume = 0.0
    for ws in session_result:
        if ws.exercises:
            for ex in ws.exercises:
                if ex.sets:
                    for s in ex.sets:
                        total_sets += 1
                        if s.weight and s.reps:
                            total_volume += float(s.weight) * s.reps

    # --- Highlights ---
    highlights: list[str] = []
    if completion_rate >= 0.9 and total_logged > 0:
        highlights.append(f"Excellent week — {round(completion_rate * 100)}% completion rate!")
    elif completion_rate >= 0.7 and total_logged > 0:
        highlights.append(f"Solid week — {round(completion_rate * 100)}% of items completed.")

    if len(journal_result) >= 5:
        highlights.append(f"Great journaling consistency — {len(journal_result)} entries this week.")

    if exercise_sessions_count >= 3:
        highlights.append(f"{exercise_sessions_count} workout sessions logged.")

    top_symptoms = symptom_counter.most_common(3)
    if top_symptoms:
        names = ", ".join(s for s, _ in top_symptoms)
        highlights.append(f"Most reported symptoms: {names}.")

    return {
        "week_start": week_start,
        "week_end": week_end,
        "adherence": {
            "taken_count": taken_count,
            "skipped_count": skipped_count,
            "total_logged": total_logged,
            "completion_rate": round(completion_rate, 3),
            "daily_rates": daily_rates,
            "best_day": best_day,
            "worst_day": worst_day,
        },
        "journal": {
            "entry_count": len(journal_result),
            "avg_energy": _avg(energy_vals),
            "avg_mood": _avg(mood_vals),
            "avg_sleep": _avg(sleep_vals),
            "avg_stress": _avg(stress_vals),
            "symptom_frequency": dict(symptom_counter.most_common()),
        },
        "exercise": {
            "session_count": exercise_sessions_count,
            "total_sets": total_sets,
            "total_volume": round(total_volume, 1),
        },
        "highlights": highlights,
    }


async def _gather_data(
    session: AsyncSession,
    user_id: UUID,
    start: date,
    end: date,
) -> tuple[list, list, list]:
    """Fetch adherence logs, journal entries, and workout sessions for the date range."""
    start_dt = datetime.combine(start, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end, time(23, 59, 59), tzinfo=timezone.utc)
    adherence_q = await session.execute(
        select(AdherenceLog).where(
            AdherenceLog.user_id == user_id,
            AdherenceLog.scheduled_at >= start_dt,
            AdherenceLog.scheduled_at <= end_dt,
        )
    )
    journal_q = await session.execute(
        select(HealthJournalEntry).where(
            HealthJournalEntry.user_id == user_id,
            HealthJournalEntry.entry_date >= start,
            HealthJournalEntry.entry_date <= end,
        )
    )
    session_q = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.started_at >= start_dt,
            WorkoutSession.started_at <= end_dt,
        )
    )

    return (
        list(adherence_q.scalars().all()),
        list(journal_q.scalars().all()),
        list(session_q.scalars().all()),
    )
