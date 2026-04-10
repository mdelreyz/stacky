import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.exercise import (
    ExerciseProgress,
    ExerciseResponse,
    ExerciseStatsOverview,
    MuscleGroupVolume,
    WeeklyOverview,
)
from app.services.exercise_stats import (
    get_exercise_progress,
    get_muscle_group_volume,
    get_stats_overview,
)

router = APIRouter(prefix="/users/me/exercise-stats", tags=["exercise-stats"])


@router.get("/overview", response_model=ExerciseStatsOverview)
async def stats_overview(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = await get_stats_overview(session, current_user.id)
    return ExerciseStatsOverview(
        weekly_summary=[WeeklyOverview(**w) for w in data["weekly_summary"]],
        total_sessions=data["total_sessions"],
        total_volume=data["total_volume"],
        favorite_exercise=data["favorite_exercise"],
    )


@router.get("/exercise/{exercise_id}", response_model=ExerciseProgress)
async def exercise_progress(
    exercise_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = await get_exercise_progress(session, current_user.id, exercise_id)
    if not data:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ExerciseProgress(
        exercise=ExerciseResponse.model_validate(data["exercise"]),
        max_weight=data["max_weight"],
        estimated_1rm=data["estimated_1rm"],
        total_volume=data["total_volume"],
        sessions_count=data["sessions_count"],
        history=data["history"],
    )


@router.get("/muscle-groups", response_model=list[MuscleGroupVolume])
async def muscle_group_stats(
    weeks: int = Query(4, ge=1, le=52),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = await get_muscle_group_volume(session, current_user.id, weeks)
    return [MuscleGroupVolume(**d) for d in data]
