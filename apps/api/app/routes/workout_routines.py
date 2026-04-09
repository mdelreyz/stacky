import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.models.workout_routine import WorkoutRoutine, WorkoutRoutineExercise
from app.schemas.common import PaginatedResponse
from app.schemas.exercise import (
    RoutineExerciseInput,
    WorkoutRoutineCreate,
    WorkoutRoutineListResponse,
    WorkoutRoutineResponse,
    WorkoutRoutineUpdate,
)
from app.services.pagination import paginate, paginated_response

router = APIRouter(prefix="/users/me/routines", tags=["workout-routines"])


def _list_item(routine: WorkoutRoutine) -> WorkoutRoutineListResponse:
    return WorkoutRoutineListResponse(
        id=routine.id,
        name=routine.name,
        description=routine.description,
        estimated_duration_minutes=routine.estimated_duration_minutes,
        is_active=routine.is_active,
        exercise_count=len(routine.exercises),
        created_at=routine.created_at,
    )


@router.get("", response_model=PaginatedResponse[WorkoutRoutineListResponse])
async def list_routines(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = Query(False),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(WorkoutRoutine).where(WorkoutRoutine.user_id == current_user.id)
    if active_only:
        query = query.where(WorkoutRoutine.is_active.is_(True))
    query = query.order_by(WorkoutRoutine.updated_at.desc())
    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[_list_item(r) for r in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.post("", response_model=WorkoutRoutineResponse, status_code=201)
async def create_routine(
    body: WorkoutRoutineCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    routine = WorkoutRoutine(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        estimated_duration_minutes=body.estimated_duration_minutes,
    )
    session.add(routine)
    await session.flush()

    for ex in body.exercises:
        session.add(WorkoutRoutineExercise(
            routine_id=routine.id,
            exercise_id=ex.exercise_id,
            sort_order=ex.sort_order,
            target_sets=ex.target_sets,
            target_reps=ex.target_reps,
            target_weight=ex.target_weight,
            target_duration_seconds=ex.target_duration_seconds,
            rest_seconds=ex.rest_seconds,
            notes=ex.notes,
        ))

    await session.commit()
    await session.refresh(routine)
    return WorkoutRoutineResponse.model_validate(routine)


@router.get("/{routine_id}", response_model=WorkoutRoutineResponse)
async def get_routine(
    routine_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(WorkoutRoutine).where(
            WorkoutRoutine.id == routine_id, WorkoutRoutine.user_id == current_user.id
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return WorkoutRoutineResponse.model_validate(routine)


@router.patch("/{routine_id}", response_model=WorkoutRoutineResponse)
async def update_routine(
    routine_id: uuid.UUID,
    body: WorkoutRoutineUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(WorkoutRoutine).where(
            WorkoutRoutine.id == routine_id, WorkoutRoutine.user_id == current_user.id
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(routine, field, value)
    await session.commit()
    await session.refresh(routine)
    return WorkoutRoutineResponse.model_validate(routine)


@router.delete("/{routine_id}", status_code=204)
async def delete_routine(
    routine_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Soft-deactivate a routine."""
    result = await session.execute(
        select(WorkoutRoutine).where(
            WorkoutRoutine.id == routine_id, WorkoutRoutine.user_id == current_user.id
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    routine.is_active = False
    await session.commit()


@router.put("/{routine_id}/exercises", response_model=WorkoutRoutineResponse)
async def replace_routine_exercises(
    routine_id: uuid.UUID,
    exercises: list[RoutineExerciseInput],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Replace the full exercise list for a routine."""
    result = await session.execute(
        select(WorkoutRoutine).where(
            WorkoutRoutine.id == routine_id, WorkoutRoutine.user_id == current_user.id
        )
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    # Clear existing and add new
    routine.exercises.clear()
    await session.flush()

    for ex in exercises:
        session.add(WorkoutRoutineExercise(
            routine_id=routine.id,
            exercise_id=ex.exercise_id,
            sort_order=ex.sort_order,
            target_sets=ex.target_sets,
            target_reps=ex.target_reps,
            target_weight=ex.target_weight,
            target_duration_seconds=ex.target_duration_seconds,
            rest_seconds=ex.rest_seconds,
            notes=ex.notes,
        ))

    await session.commit()
    await session.refresh(routine)
    return WorkoutRoutineResponse.model_validate(routine)
