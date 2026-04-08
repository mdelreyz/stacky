import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.supplement import Supplement
from app.models.user import User
from app.models.user_supplement import UserSupplement
from app.schemas.common import PaginatedResponse
from app.schemas.supplement import (
    SupplementResponse,
    UserSupplementCreate,
    UserSupplementResponse,
    UserSupplementUpdate,
)
from app.services.ai_onboarding import resolve_ai_status

router = APIRouter(prefix="/users/me/supplements", tags=["user-supplements"])


async def _serialize_user_supplement(user_supplement: UserSupplement) -> UserSupplementResponse:
    ai_status, ai_error = await resolve_ai_status(user_supplement.supplement)
    return UserSupplementResponse(
        id=user_supplement.id,
        supplement=SupplementResponse(
            id=user_supplement.supplement.id,
            name=user_supplement.supplement.name,
            category=user_supplement.supplement.category,
            form=user_supplement.supplement.form,
            description=user_supplement.supplement.description,
            ai_profile=user_supplement.supplement.ai_profile,
            ai_status=ai_status,
            ai_error=ai_error,
            ai_generated_at=user_supplement.supplement.ai_generated_at,
            is_verified=user_supplement.supplement.is_verified,
        ),
        dosage_amount=float(user_supplement.dosage_amount),
        dosage_unit=user_supplement.dosage_unit,
        frequency=user_supplement.frequency,
        take_window=user_supplement.take_window,
        with_food=user_supplement.with_food,
        notes=user_supplement.notes,
        is_active=user_supplement.is_active,
        started_at=user_supplement.started_at,
        ended_at=user_supplement.ended_at,
        created_at=user_supplement.created_at,
    )


@router.get("", response_model=PaginatedResponse[UserSupplementResponse])
async def list_user_supplements(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    base_query = select(UserSupplement).where(UserSupplement.user_id == current_user.id)
    if active_only:
        base_query = base_query.where(UserSupplement.is_active.is_(True))

    count_result = await session.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await session.execute(base_query.order_by(UserSupplement.created_at.desc()).offset(offset).limit(page_size))
    user_supplements = list(result.scalars().all())

    return PaginatedResponse(
        items=[await _serialize_user_supplement(us) for us in user_supplements],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.post("", response_model=UserSupplementResponse, status_code=201)
async def add_user_supplement(
    data: UserSupplementCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Verify supplement exists
    result = await session.execute(select(Supplement).where(Supplement.id == data.supplement_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Supplement not found")

    existing_result = await session.execute(
        select(UserSupplement).where(
            UserSupplement.user_id == current_user.id,
            UserSupplement.supplement_id == data.supplement_id,
            UserSupplement.is_active.is_(True),
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Supplement already active in your protocol")

    user_supplement = UserSupplement(
        user_id=current_user.id,
        supplement_id=data.supplement_id,
        dosage_amount=data.dosage_amount,
        dosage_unit=data.dosage_unit,
        frequency=data.frequency,
        take_window=data.take_window,
        with_food=data.with_food,
        notes=data.notes,
        started_at=data.started_at,
    )
    session.add(user_supplement)
    await session.commit()
    await session.refresh(user_supplement)

    return await _serialize_user_supplement(user_supplement)


@router.patch("/{user_supplement_id}", response_model=UserSupplementResponse)
async def update_user_supplement(
    user_supplement_id: uuid.UUID,
    data: UserSupplementUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserSupplement).where(
            UserSupplement.id == user_supplement_id,
            UserSupplement.user_id == current_user.id,
        )
    )
    user_supplement = result.scalar_one_or_none()
    if not user_supplement:
        raise HTTPException(status_code=404, detail="User supplement not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_supplement, key, value)

    await session.commit()
    await session.refresh(user_supplement)
    return await _serialize_user_supplement(user_supplement)


@router.delete("/{user_supplement_id}", status_code=204)
async def remove_user_supplement(
    user_supplement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserSupplement).where(
            UserSupplement.id == user_supplement_id,
            UserSupplement.user_id == current_user.id,
        )
    )
    user_supplement = result.scalar_one_or_none()
    if not user_supplement:
        raise HTTPException(status_code=404, detail="User supplement not found")

    await session.delete(user_supplement)
    await session.commit()
