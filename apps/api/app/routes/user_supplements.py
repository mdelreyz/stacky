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
from app.schemas.supplement import UserSupplementCreate, UserSupplementResponse, UserSupplementUpdate

router = APIRouter(prefix="/users/me/supplements", tags=["user-supplements"])


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
        items=[UserSupplementResponse.model_validate(us) for us in user_supplements],
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

    return UserSupplementResponse.model_validate(user_supplement)


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
    return UserSupplementResponse.model_validate(user_supplement)


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
