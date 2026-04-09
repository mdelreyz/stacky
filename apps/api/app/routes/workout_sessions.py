import uuid
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.user import User
from app.models.workout_session import WorkoutSession, WorkoutSessionExercise, WorkoutSet
from app.schemas.common import PaginatedResponse
from app.schemas.exercise import (
    SessionExerciseInput,
    WorkoutSessionCreate,
    WorkoutSessionListResponse,
    WorkoutSessionResponse,
    WorkoutSessionUpdate,
    WorkoutSetInput,
    WorkoutSetResponse,
    WorkoutSetUpdate,
)
from app.services.pagination import paginate, paginated_response

router = APIRouter(prefix="/users/me/sessions", tags=["workout-sessions"])


def _list_item(s: WorkoutSession) -> WorkoutSessionListResponse:
    total_sets = sum(len(ex.sets) for ex in s.logged_exercises)
    return WorkoutSessionListResponse(
        id=s.id,
        name=s.name,
        routine_id=s.routine_id,
        started_at=s.started_at,
        completed_at=s.completed_at,
        duration_minutes=s.duration_minutes,
        location_name=s.location_name,
        exercise_count=len(s.logged_exercises),
        total_sets=total_sets,
        created_at=s.created_at,
    )


@router.get("", response_model=PaginatedResponse[WorkoutSessionListResponse])
async def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    date_from: date | None = None,
    date_to: date | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(WorkoutSession).where(WorkoutSession.user_id == current_user.id)
    if date_from:
        query = query.where(WorkoutSession.started_at >= datetime.combine(date_from, time.min, tzinfo=timezone.utc))
    if date_to:
        query = query.where(WorkoutSession.started_at <= datetime.combine(date_to, time.max, tzinfo=timezone.utc))
    query = query.order_by(WorkoutSession.started_at.desc())

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[_list_item(s) for s in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.post("", response_model=WorkoutSessionResponse, status_code=201)
async def start_session(
    body: WorkoutSessionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Start a new workout session (from routine or ad-hoc)."""
    ws = WorkoutSession(
        user_id=current_user.id,
        routine_id=body.routine_id,
        regime_id=body.regime_id,
        name=body.name,
        started_at=body.started_at,
        notes=body.notes,
        latitude=body.latitude,
        longitude=body.longitude,
        location_name=body.location_name,
    )
    session.add(ws)

    # If starting from a routine, pre-populate exercises
    if body.routine_id:
        from app.models.workout_routine import WorkoutRoutine
        result = await session.execute(
            select(WorkoutRoutine).where(
                WorkoutRoutine.id == body.routine_id,
                WorkoutRoutine.user_id == current_user.id,
            )
        )
        routine = result.scalar_one_or_none()
        if routine:
            await session.flush()
            for rex in routine.exercises:
                session.add(WorkoutSessionExercise(
                    session_id=ws.id,
                    exercise_id=rex.exercise_id,
                    sort_order=rex.sort_order,
                ))

    await session.commit()
    await session.refresh(ws)
    return WorkoutSessionResponse.model_validate(ws)


@router.get("/{session_id}", response_model=WorkoutSessionResponse)
async def get_session_detail(
    session_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    return WorkoutSessionResponse.model_validate(ws)


@router.patch("/{session_id}", response_model=WorkoutSessionResponse)
async def update_session(
    session_id: uuid.UUID,
    body: WorkoutSessionUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ws, field, value)
    await session.commit()
    await session.refresh(ws)
    return WorkoutSessionResponse.model_validate(ws)


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")
    await session.delete(ws)
    await session.commit()


# ─── Session exercises ────────────────────────────────────────────


@router.post("/{session_id}/exercises", response_model=WorkoutSessionResponse, status_code=201)
async def add_session_exercise(
    session_id: uuid.UUID,
    body: SessionExerciseInput,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")

    session.add(WorkoutSessionExercise(
        session_id=ws.id,
        exercise_id=body.exercise_id,
        sort_order=body.sort_order,
        notes=body.notes,
    ))
    await session.commit()
    await session.refresh(ws)
    return WorkoutSessionResponse.model_validate(ws)


# ─── Sets ─────────────────────────────────────────────────────────


@router.post(
    "/{session_id}/exercises/{exercise_id}/sets",
    response_model=WorkoutSetResponse,
    status_code=201,
)
async def log_set(
    session_id: uuid.UUID,
    exercise_id: uuid.UUID,
    body: WorkoutSetInput,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Verify session ownership
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Session not found")

    # Find the session exercise
    result = await session.execute(
        select(WorkoutSessionExercise).where(
            WorkoutSessionExercise.id == exercise_id,
            WorkoutSessionExercise.session_id == session_id,
        )
    )
    se = result.scalar_one_or_none()
    if not se:
        raise HTTPException(status_code=404, detail="Exercise not found in session")

    workout_set = WorkoutSet(
        session_exercise_id=se.id,
        set_number=body.set_number,
        reps=body.reps,
        weight=body.weight,
        duration_seconds=body.duration_seconds,
        rpe=body.rpe,
        is_warmup=body.is_warmup,
        is_dropset=body.is_dropset,
        notes=body.notes,
    )
    session.add(workout_set)
    await session.commit()
    await session.refresh(workout_set)
    return WorkoutSetResponse.model_validate(workout_set)


@router.patch("/{session_id}/sets/{set_id}", response_model=WorkoutSetResponse)
async def update_set(
    session_id: uuid.UUID,
    set_id: uuid.UUID,
    body: WorkoutSetUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Verify session ownership
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    result = await session.execute(select(WorkoutSet).where(WorkoutSet.id == set_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Set not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ws, field, value)
    await session.commit()
    await session.refresh(ws)
    return WorkoutSetResponse.model_validate(ws)


@router.delete("/{session_id}/sets/{set_id}", status_code=204)
async def delete_set(
    session_id: uuid.UUID,
    set_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Verify session ownership
    result = await session.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    result = await session.execute(select(WorkoutSet).where(WorkoutSet.id == set_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Set not found")
    await session.delete(ws)
    await session.commit()
