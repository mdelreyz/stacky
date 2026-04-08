import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.nutrition_cycle import NutritionCycle
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.nutrition import NutritionCycleCreate, NutritionCycleResponse, NutritionCycleUpdate
from app.services.daily_plan import resolve_user_date
from app.services.nutrition_cycles import sync_nutrition_cycle

router = APIRouter(prefix="/users/me/nutrition", tags=["nutrition"])


async def _get_user_cycle_or_404(
    session: AsyncSession, current_user: User, nutrition_id: uuid.UUID
) -> NutritionCycle:
    result = await session.execute(
        select(NutritionCycle).where(
            NutritionCycle.id == nutrition_id,
            NutritionCycle.user_id == current_user.id,
        )
    )
    cycle = result.scalar_one_or_none()
    if cycle is None:
        raise HTTPException(status_code=404, detail="Nutrition plan not found")
    return cycle


async def _ensure_no_other_active_cycle(
    session: AsyncSession, current_user: User, *, exclude_id: uuid.UUID | None = None
) -> None:
    query = select(NutritionCycle).where(
        NutritionCycle.user_id == current_user.id,
        NutritionCycle.is_active.is_(True),
    )
    if exclude_id is not None:
        query = query.where(NutritionCycle.id != exclude_id)

    existing_active = await session.execute(query)
    if existing_active.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="A nutrition plan is already active")


@router.get("", response_model=PaginatedResponse[NutritionCycleResponse])
async def list_nutrition_cycles(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    base_query = select(NutritionCycle).where(NutritionCycle.user_id == current_user.id)
    if active_only:
        base_query = base_query.where(NutritionCycle.is_active.is_(True))

    count_result = await session.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await session.execute(base_query.order_by(NutritionCycle.created_at.desc()).offset(offset).limit(page_size))
    cycles = list(result.scalars().all())

    today, _user_tz = resolve_user_date(None, current_user.timezone)
    for cycle in cycles:
        sync_nutrition_cycle(cycle, today)

    return PaginatedResponse(
        items=cycles,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.get("/{nutrition_id}", response_model=NutritionCycleResponse)
async def get_nutrition_cycle(
    nutrition_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cycle = await _get_user_cycle_or_404(session, current_user, nutrition_id)
    today, _user_tz = resolve_user_date(None, current_user.timezone)
    sync_nutrition_cycle(cycle, today)
    return cycle


@router.post("", response_model=NutritionCycleResponse, status_code=201)
async def create_nutrition_cycle(
    data: NutritionCycleCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_no_other_active_cycle(session, current_user)

    cycle = NutritionCycle(
        user_id=current_user.id,
        cycle_type=data.cycle_type,
        name=data.name,
        phases=[phase.model_dump() for phase in data.phases],
        current_phase_idx=0,
        phase_started_at=data.phase_started_at,
        next_transition=data.phase_started_at + timedelta(days=data.phases[0].duration_days),
        is_active=True,
    )
    today, _user_tz = resolve_user_date(None, current_user.timezone)
    sync_nutrition_cycle(cycle, today)

    session.add(cycle)
    await session.commit()
    await session.refresh(cycle)
    return cycle


@router.patch("/{nutrition_id}", response_model=NutritionCycleResponse)
async def update_nutrition_cycle(
    nutrition_id: uuid.UUID,
    data: NutritionCycleUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cycle = await _get_user_cycle_or_404(session, current_user, nutrition_id)

    if data.is_active is True and not cycle.is_active:
        await _ensure_no_other_active_cycle(session, current_user, exclude_id=cycle.id)

    if data.cycle_type is not None:
        cycle.cycle_type = data.cycle_type
    if data.name is not None:
        cycle.name = data.name
    if data.phases is not None:
        cycle.phases = [phase.model_dump() for phase in data.phases]
    if data.phase_started_at is not None:
        cycle.phase_started_at = data.phase_started_at
    if data.is_active is not None:
        cycle.is_active = data.is_active

    today, _user_tz = resolve_user_date(None, current_user.timezone)
    sync_nutrition_cycle(cycle, today)

    await session.commit()
    await session.refresh(cycle)
    return cycle


@router.delete("/{nutrition_id}", status_code=204)
async def remove_nutrition_cycle(
    nutrition_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cycle = await _get_user_cycle_or_404(session, current_user, nutrition_id)
    cycle.is_active = False
    await session.commit()
