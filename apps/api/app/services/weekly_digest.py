"""Weekly digest — synthesizes adherence, journal, and exercise data for a week."""

from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
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
    previous_week_end = week_start - timedelta(days=1)
    previous_week_start = previous_week_end - timedelta(days=6)
    current_month_start, current_month_end, previous_month_start, previous_month_end = _month_to_date_window(week_end)

    adherence_result, journal_result, session_result = await _gather_data(
        session, user_id, week_start, week_end
    )
    prev_adherence_result, prev_journal_result, prev_session_result = await _gather_data(
        session, user_id, previous_week_start, previous_week_end
    )
    month_adherence_result, month_journal_result, month_session_result = await _gather_data(
        session, user_id, current_month_start, current_month_end
    )
    previous_month_adherence_result, previous_month_journal_result, previous_month_session_result = await _gather_data(
        session, user_id, previous_month_start, previous_month_end
    )

    adherence = _build_adherence_summary(adherence_result, week_start, week_end)
    journal = _build_journal_summary(journal_result)
    exercise = _build_exercise_summary(session_result)
    highlights = _build_highlights(adherence, journal, exercise)

    previous_adherence = _build_adherence_summary(prev_adherence_result, previous_week_start, previous_week_end)
    previous_journal = _build_journal_summary(prev_journal_result)
    previous_exercise = _build_exercise_summary(prev_session_result)
    monthly_adherence = _build_adherence_summary(month_adherence_result, current_month_start, current_month_end)
    monthly_journal = _build_journal_summary(month_journal_result)
    monthly_exercise = _build_exercise_summary(month_session_result)
    previous_month_adherence = _build_adherence_summary(
        previous_month_adherence_result,
        previous_month_start,
        previous_month_end,
    )
    previous_month_journal = _build_journal_summary(previous_month_journal_result)
    previous_month_exercise = _build_exercise_summary(previous_month_session_result)

    return {
        "week_start": week_start,
        "week_end": week_end,
        "adherence": adherence,
        "journal": journal,
        "exercise": exercise,
        "highlights": highlights,
        "comparison": {
            "previous_week_start": previous_week_start,
            "previous_week_end": previous_week_end,
            **_build_comparison(adherence, journal, exercise, previous_adherence, previous_journal, previous_exercise),
        },
        "monthly_comparison": {
            "current_month_start": current_month_start,
            "current_month_end": current_month_end,
            "previous_month_start": previous_month_start,
            "previous_month_end": previous_month_end,
            **_build_comparison(
                monthly_adherence,
                monthly_journal,
                monthly_exercise,
                previous_month_adherence,
                previous_month_journal,
                previous_month_exercise,
            ),
        },
    }


def _build_adherence_summary(
    adherence_result: list[AdherenceLog],
    week_start: date,
    week_end: date,
) -> dict:
    taken_count = sum(1 for log in adherence_result if log.taken_at is not None)
    skipped_count = sum(1 for log in adherence_result if log.skipped)
    total_logged = len(adherence_result)
    completion_rate = taken_count / total_logged if total_logged > 0 else 0.0

    day_taken: dict[str, int] = {}
    day_total: dict[str, int] = {}
    for log in adherence_result:
        day_key = log.scheduled_at.date().isoformat()
        day_total[day_key] = day_total.get(day_key, 0) + 1
        if log.taken_at is not None:
            day_taken[day_key] = day_taken.get(day_key, 0) + 1

    daily_rates: list[dict] = []
    best_day = None
    worst_day = None
    best_rate = -1.0
    worst_rate = 2.0

    current = week_start
    while current <= week_end:
        day_key = current.isoformat()
        total = day_total.get(day_key, 0)
        taken = day_taken.get(day_key, 0)
        rate = taken / total if total > 0 else None
        daily_rates.append({"date": day_key, "taken": taken, "total": total, "rate": rate})

        if rate is not None:
            if rate > best_rate:
                best_rate = rate
                best_day = day_key
            if rate < worst_rate:
                worst_rate = rate
                worst_day = day_key

        current += timedelta(days=1)

    return {
        "taken_count": taken_count,
        "skipped_count": skipped_count,
        "total_logged": total_logged,
        "completion_rate": round(completion_rate, 3),
        "daily_rates": daily_rates,
        "best_day": best_day,
        "worst_day": worst_day,
    }


def _build_journal_summary(journal_result: list[HealthJournalEntry]) -> dict:
    energy_vals = [entry.energy_level for entry in journal_result if entry.energy_level is not None]
    mood_vals = [entry.mood_level for entry in journal_result if entry.mood_level is not None]
    sleep_vals = [entry.sleep_quality for entry in journal_result if entry.sleep_quality is not None]
    stress_vals = [entry.stress_level for entry in journal_result if entry.stress_level is not None]

    symptom_counter: Counter[str] = Counter()
    for entry in journal_result:
        if entry.symptoms:
            for symptom in entry.symptoms:
                symptom_counter[symptom] += 1

    return {
        "entry_count": len(journal_result),
        "avg_energy": _avg(energy_vals),
        "avg_mood": _avg(mood_vals),
        "avg_sleep": _avg(sleep_vals),
        "avg_stress": _avg(stress_vals),
        "symptom_frequency": dict(symptom_counter.most_common()),
    }


def _build_exercise_summary(session_result: list[WorkoutSession]) -> dict:
    total_sets = 0
    total_volume = 0.0
    for workout_session in session_result:
        if not workout_session.exercises:
            continue
        for exercise in workout_session.exercises:
            if not exercise.sets:
                continue
            for logged_set in exercise.sets:
                total_sets += 1
                if logged_set.weight and logged_set.reps:
                    total_volume += float(logged_set.weight) * logged_set.reps

    return {
        "session_count": len(session_result),
        "total_sets": total_sets,
        "total_volume": round(total_volume, 1),
    }


def _build_highlights(adherence: dict, journal: dict, exercise: dict) -> list[str]:
    highlights: list[str] = []

    if adherence["completion_rate"] >= 0.9 and adherence["total_logged"] > 0:
        highlights.append(f"Excellent week — {round(adherence['completion_rate'] * 100)}% completion rate!")
    elif adherence["completion_rate"] >= 0.7 and adherence["total_logged"] > 0:
        highlights.append(f"Solid week — {round(adherence['completion_rate'] * 100)}% of items completed.")

    if journal["entry_count"] >= 5:
        highlights.append(f"Great journaling consistency — {journal['entry_count']} entries this week.")

    if exercise["session_count"] >= 3:
        highlights.append(f"{exercise['session_count']} workout sessions logged.")

    top_symptoms = Counter(journal["symptom_frequency"]).most_common(3)
    if top_symptoms:
        names = ", ".join(symptom for symptom, _ in top_symptoms)
        highlights.append(f"Most reported symptoms: {names}.")

    return highlights


def _build_comparison(
    adherence: dict,
    journal: dict,
    exercise: dict,
    previous_adherence: dict,
    previous_journal: dict,
    previous_exercise: dict,
) -> dict:
    return {
        "adherence_completion_rate": _metric_delta(
            adherence["completion_rate"],
            previous_adherence["completion_rate"],
            digits=3,
        ),
        "journal_entry_count": _metric_delta(
            journal["entry_count"],
            previous_journal["entry_count"],
        ),
        "journal_avg_energy": _metric_delta(
            journal["avg_energy"],
            previous_journal["avg_energy"],
            digits=1,
        ),
        "exercise_session_count": _metric_delta(
            exercise["session_count"],
            previous_exercise["session_count"],
        ),
        "exercise_total_volume": _metric_delta(
            exercise["total_volume"],
            previous_exercise["total_volume"],
            digits=1,
        ),
    }


def _month_to_date_window(period_end: date) -> tuple[date, date, date, date]:
    current_month_start = period_end.replace(day=1)
    elapsed_days = (period_end - current_month_start).days

    previous_month_end = current_month_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    previous_month_comparison_end = min(
        previous_month_end,
        previous_month_start + timedelta(days=elapsed_days),
    )

    return current_month_start, period_end, previous_month_start, previous_month_comparison_end


def _avg(values: list[int]) -> float | None:
    return round(sum(values) / len(values), 1) if values else None


def _metric_delta(
    current: int | float | None,
    previous: int | float | None,
    *,
    digits: int | None = None,
) -> dict:
    normalized_current = round(current, digits) if isinstance(current, float) and digits is not None else current
    normalized_previous = round(previous, digits) if isinstance(previous, float) and digits is not None else previous

    delta = None
    if normalized_current is not None and normalized_previous is not None:
        delta = normalized_current - normalized_previous
        if isinstance(delta, float) and digits is not None:
            delta = round(delta, digits)

    return {
        "current": normalized_current,
        "previous": normalized_previous,
        "delta": delta,
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
