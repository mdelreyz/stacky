"""Exercise statistics — computed on-the-fly from workout_sets data."""

import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.workout_session import WorkoutSession


def _iso_week(d: date) -> str:
    """Return ISO week string e.g. '2026-W15'."""
    iso = d.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _epley_1rm(weight: float, reps: int) -> float:
    """Estimated 1RM using Epley formula."""
    if reps <= 0 or weight <= 0:
        return 0.0
    if reps == 1:
        return weight
    return weight * (1 + reps / 30)


async def get_weekly_overview(
    session: AsyncSession,
    user_id: uuid.UUID,
    weeks: int = 8,
) -> list[dict]:
    """Weekly aggregates: sessions, sets, reps, volume for last N weeks."""
    cutoff = datetime.combine(
        date.today() - timedelta(weeks=weeks),
        time.min,
        tzinfo=timezone.utc,
    )

    result = await session.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user_id, WorkoutSession.started_at >= cutoff)
        .order_by(WorkoutSession.started_at)
    )
    sessions = result.scalars().all()

    week_data: dict[str, dict] = defaultdict(
        lambda: {"sessions": 0, "total_sets": 0, "total_reps": 0, "total_volume": 0.0}
    )

    for ws in sessions:
        week_key = _iso_week(ws.started_at.date())
        week_data[week_key]["sessions"] += 1
        for ex in ws.logged_exercises:
            for s in ex.sets:
                if s.is_warmup:
                    continue
                week_data[week_key]["total_sets"] += 1
                week_data[week_key]["total_reps"] += s.reps or 0
                if s.weight and s.reps:
                    week_data[week_key]["total_volume"] += s.weight * s.reps

    return [{"week": k, **v} for k, v in sorted(week_data.items())]


async def get_exercise_progress(
    session: AsyncSession,
    user_id: uuid.UUID,
    exercise_id: uuid.UUID,
) -> dict | None:
    """Per-exercise progress: max weight, 1RM, volume timeline."""
    ex_result = await session.execute(select(Exercise).where(Exercise.id == exercise_id))
    exercise = ex_result.scalar_one_or_none()
    if not exercise:
        return None

    result = await session.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user_id)
        .order_by(WorkoutSession.started_at)
    )
    sessions = result.scalars().all()

    max_weight = 0.0
    estimated_1rm = 0.0
    total_volume = 0.0
    sessions_count = 0
    history = []

    for ws in sessions:
        session_max = 0.0
        session_volume = 0.0
        session_sets = 0
        session_reps = 0
        found = False

        for se in ws.logged_exercises:
            if se.exercise_id != exercise_id:
                continue
            found = True
            for s in se.sets:
                if s.is_warmup:
                    continue
                session_sets += 1
                session_reps += s.reps or 0
                w = s.weight or 0.0
                r = s.reps or 0
                if w > session_max and r >= 1:
                    session_max = w
                if w and r:
                    session_volume += w * r
                    e1rm = _epley_1rm(w, r)
                    if e1rm > estimated_1rm:
                        estimated_1rm = e1rm

        if found:
            sessions_count += 1
            total_volume += session_volume
            if session_max > max_weight:
                max_weight = session_max
            history.append({
                "date": ws.started_at.date().isoformat(),
                "max_weight": session_max,
                "volume": session_volume,
                "sets": session_sets,
                "reps": session_reps,
            })

    return {
        "exercise": exercise,
        "max_weight": max_weight or None,
        "estimated_1rm": round(estimated_1rm, 1) or None,
        "total_volume": total_volume,
        "sessions_count": sessions_count,
        "history": history,
    }


async def get_muscle_group_volume(
    session: AsyncSession,
    user_id: uuid.UUID,
    weeks: int = 4,
) -> list[dict]:
    """Volume by muscle group for last N weeks."""
    cutoff = datetime.combine(
        date.today() - timedelta(weeks=weeks),
        time.min,
        tzinfo=timezone.utc,
    )

    result = await session.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user_id, WorkoutSession.started_at >= cutoff)
    )
    sessions = result.scalars().all()

    muscle_data: dict[str, dict] = defaultdict(
        lambda: {"total_volume": 0.0, "total_sets": 0, "exercises": set()}
    )

    for ws in sessions:
        for se in ws.logged_exercises:
            muscle = se.exercise.primary_muscle.value if se.exercise else "unknown"
            muscle_data[muscle]["exercises"].add(se.exercise_id)
            for s in se.sets:
                if s.is_warmup:
                    continue
                muscle_data[muscle]["total_sets"] += 1
                if s.weight and s.reps:
                    muscle_data[muscle]["total_volume"] += s.weight * s.reps

    return [
        {
            "muscle_group": k,
            "total_volume": v["total_volume"],
            "total_sets": v["total_sets"],
            "exercise_count": len(v["exercises"]),
        }
        for k, v in sorted(muscle_data.items(), key=lambda x: x[1]["total_volume"], reverse=True)
    ]


async def get_stats_overview(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> dict:
    """High-level stats overview."""
    weekly = await get_weekly_overview(session, user_id)

    result = await session.execute(
        select(WorkoutSession).where(WorkoutSession.user_id == user_id)
    )
    all_sessions = result.scalars().all()

    total_volume = 0.0
    exercise_volume: dict[str, float] = defaultdict(float)

    for ws in all_sessions:
        for se in ws.logged_exercises:
            for s in se.sets:
                if s.is_warmup:
                    continue
                if s.weight and s.reps:
                    vol = s.weight * s.reps
                    total_volume += vol
                    if se.exercise:
                        exercise_volume[se.exercise.name] += vol

    favorite = max(exercise_volume, key=exercise_volume.get) if exercise_volume else None

    return {
        "weekly_summary": weekly,
        "total_sessions": len(all_sessions),
        "total_volume": total_volume,
        "favorite_exercise": favorite,
    }
