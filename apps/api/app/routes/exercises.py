import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.exercise import Exercise
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.exercise import ExerciseCreate, ExerciseResponse, ExerciseUpdate
from app.services.pagination import paginate, paginated_response

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=PaginatedResponse[ExerciseResponse])
async def list_exercises(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    muscle: str | None = None,
    equipment: str | None = None,
    mine_only: bool = False,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List exercises — shared catalog + user's custom exercises."""
    if mine_only:
        query = select(Exercise).where(Exercise.user_id == current_user.id)
    else:
        query = select(Exercise).where(
            or_(Exercise.user_id.is_(None), Exercise.user_id == current_user.id)
        )

    if search:
        query = query.where(Exercise.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Exercise.category == category)
    if muscle:
        query = query.where(Exercise.primary_muscle == muscle)
    if equipment:
        query = query.where(Exercise.equipment == equipment)

    query = query.order_by(Exercise.name)
    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[ExerciseResponse.model_validate(e) for e in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            or_(Exercise.user_id.is_(None), Exercise.user_id == current_user.id),
        )
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ExerciseResponse.model_validate(exercise)


@router.post("", response_model=ExerciseResponse, status_code=201)
async def create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a custom exercise owned by the current user."""
    exercise = Exercise(
        user_id=current_user.id,
        name=body.name,
        category=body.category,
        primary_muscle=body.primary_muscle,
        secondary_muscles=body.secondary_muscles,
        equipment=body.equipment,
        description=body.description,
        instructions=body.instructions,
        is_compound=body.is_compound,
    )
    session.add(exercise)
    await session.commit()
    await session.refresh(exercise)
    return ExerciseResponse.model_validate(exercise)


@router.patch("/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: uuid.UUID,
    body: ExerciseUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update a custom exercise — only the owner can edit."""
    result = await session.execute(
        select(Exercise).where(Exercise.id == exercise_id, Exercise.user_id == current_user.id)
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found or not owned by you")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(exercise, field, value)
    await session.commit()
    await session.refresh(exercise)
    return ExerciseResponse.model_validate(exercise)


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a custom exercise — only the owner can delete."""
    result = await session.execute(
        select(Exercise).where(Exercise.id == exercise_id, Exercise.user_id == current_user.id)
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found or not owned by you")
    await session.delete(exercise)
    await session.commit()
