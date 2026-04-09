import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.enums import WeekDay
from app.models.exercise_regime import ExerciseRegime, ExerciseRegimeEntry
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.exercise import (
    ExerciseRegimeCreate,
    ExerciseRegimeResponse,
    ExerciseRegimeUpdate,
    RegimeEntryInput,
    WorkoutRoutineResponse,
)
from app.services.pagination import paginate, paginated_response

router = APIRouter(prefix="/users/me/exercise-regimes", tags=["exercise-regimes"])

_WEEKDAY_MAP = {
    0: WeekDay.monday,
    1: WeekDay.tuesday,
    2: WeekDay.wednesday,
    3: WeekDay.thursday,
    4: WeekDay.friday,
    5: WeekDay.saturday,
    6: WeekDay.sunday,
}


@router.get("", response_model=PaginatedResponse[ExerciseRegimeResponse])
async def list_regimes(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = Query(False),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(ExerciseRegime).where(ExerciseRegime.user_id == current_user.id)
    if active_only:
        query = query.where(ExerciseRegime.is_active.is_(True))
    query = query.order_by(ExerciseRegime.updated_at.desc())
    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[ExerciseRegimeResponse.model_validate(r) for r in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.post("", response_model=ExerciseRegimeResponse, status_code=201)
async def create_regime(
    body: ExerciseRegimeCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    regime = ExerciseRegime(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
    )
    session.add(regime)
    await session.flush()

    for entry in body.schedule:
        session.add(ExerciseRegimeEntry(
            regime_id=regime.id,
            routine_id=entry.routine_id,
            day_of_week=entry.day_of_week,
            sort_order=entry.sort_order,
        ))

    await session.commit()
    await session.refresh(regime)
    return ExerciseRegimeResponse.model_validate(regime)


@router.get("/today", response_model=list[WorkoutRoutineResponse])
async def get_todays_routines(
    target_date: date | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return today's routine(s) from the user's active regime."""
    d = target_date or date.today()
    weekday = _WEEKDAY_MAP[d.weekday()]

    result = await session.execute(
        select(ExerciseRegime).where(
            ExerciseRegime.user_id == current_user.id,
            ExerciseRegime.is_active.is_(True),
        )
    )
    active_regime = result.scalar_one_or_none()
    if not active_regime:
        return []

    routines = []
    for entry in active_regime.schedule_entries:
        if entry.day_of_week == weekday:
            routines.append(WorkoutRoutineResponse.model_validate(entry.routine))
    return routines


@router.get("/{regime_id}", response_model=ExerciseRegimeResponse)
async def get_regime(
    regime_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(ExerciseRegime).where(
            ExerciseRegime.id == regime_id, ExerciseRegime.user_id == current_user.id
        )
    )
    regime = result.scalar_one_or_none()
    if not regime:
        raise HTTPException(status_code=404, detail="Exercise regime not found")
    return ExerciseRegimeResponse.model_validate(regime)


@router.patch("/{regime_id}", response_model=ExerciseRegimeResponse)
async def update_regime(
    regime_id: uuid.UUID,
    body: ExerciseRegimeUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(ExerciseRegime).where(
            ExerciseRegime.id == regime_id, ExerciseRegime.user_id == current_user.id
        )
    )
    regime = result.scalar_one_or_none()
    if not regime:
        raise HTTPException(status_code=404, detail="Exercise regime not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(regime, field, value)
    await session.commit()
    await session.refresh(regime)
    return ExerciseRegimeResponse.model_validate(regime)


@router.delete("/{regime_id}", status_code=204)
async def delete_regime(
    regime_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Soft-deactivate a regime."""
    result = await session.execute(
        select(ExerciseRegime).where(
            ExerciseRegime.id == regime_id, ExerciseRegime.user_id == current_user.id
        )
    )
    regime = result.scalar_one_or_none()
    if not regime:
        raise HTTPException(status_code=404, detail="Exercise regime not found")
    regime.is_active = False
    await session.commit()


@router.put("/{regime_id}/schedule", response_model=ExerciseRegimeResponse)
async def replace_regime_schedule(
    regime_id: uuid.UUID,
    schedule: list[RegimeEntryInput],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Replace the full schedule for a regime."""
    result = await session.execute(
        select(ExerciseRegime).where(
            ExerciseRegime.id == regime_id, ExerciseRegime.user_id == current_user.id
        )
    )
    regime = result.scalar_one_or_none()
    if not regime:
        raise HTTPException(status_code=404, detail="Exercise regime not found")

    regime.schedule_entries.clear()
    await session.flush()

    for entry in schedule:
        session.add(ExerciseRegimeEntry(
            regime_id=regime.id,
            routine_id=entry.routine_id,
            day_of_week=entry.day_of_week,
            sort_order=entry.sort_order,
        ))

    await session.commit()
    await session.refresh(regime)
    return ExerciseRegimeResponse.model_validate(regime)
