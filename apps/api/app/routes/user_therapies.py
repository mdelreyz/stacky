import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.therapy import Therapy
from app.models.user import User
from app.models.user_therapy import UserTherapy
from app.schemas.common import PaginatedResponse
from app.schemas.therapy import UserTherapyCreate, UserTherapyResponse, UserTherapyUpdate
from app.services.daily_plan import resolve_user_date
from app.services.pagination import paginate, paginated_response
from app.services.user_therapy_serialization import serialize_user_therapy

router = APIRouter(prefix="/users/me/therapies", tags=["user-therapies"])


@router.get("", response_model=PaginatedResponse[UserTherapyResponse])
async def list_user_therapies(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(UserTherapy).where(UserTherapy.user_id == current_user.id).order_by(UserTherapy.created_at.desc())
    if active_only:
        query = query.where(UserTherapy.is_active.is_(True))

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[await serialize_user_therapy(ut) for ut in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{user_therapy_id}", response_model=UserTherapyResponse)
async def get_user_therapy(
    user_therapy_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserTherapy).where(
            UserTherapy.id == user_therapy_id,
            UserTherapy.user_id == current_user.id,
        )
    )
    user_therapy = result.scalar_one_or_none()
    if not user_therapy:
        raise HTTPException(status_code=404, detail="User therapy not found")
    return await serialize_user_therapy(user_therapy)


@router.post("", response_model=UserTherapyResponse, status_code=201)
async def add_user_therapy(
    data: UserTherapyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Therapy).where(Therapy.id == data.therapy_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Therapy not found")

    existing_result = await session.execute(
        select(UserTherapy).where(
            UserTherapy.user_id == current_user.id,
            UserTherapy.therapy_id == data.therapy_id,
            UserTherapy.is_active.is_(True),
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Therapy already active in your protocol")

    user_therapy = UserTherapy(
        user_id=current_user.id,
        therapy_id=data.therapy_id,
        duration_minutes=data.duration_minutes,
        frequency=data.frequency,
        take_window=data.take_window,
        settings=data.settings,
        notes=data.notes,
        started_at=data.started_at,
    )
    session.add(user_therapy)
    await session.commit()
    await session.refresh(user_therapy)

    return await serialize_user_therapy(user_therapy)


@router.patch("/{user_therapy_id}", response_model=UserTherapyResponse)
async def update_user_therapy(
    user_therapy_id: uuid.UUID,
    data: UserTherapyUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserTherapy).where(
            UserTherapy.id == user_therapy_id,
            UserTherapy.user_id == current_user.id,
        )
    )
    user_therapy = result.scalar_one_or_none()
    if not user_therapy:
        raise HTTPException(status_code=404, detail="User therapy not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_therapy, key, value)

    await session.commit()
    await session.refresh(user_therapy)
    return await serialize_user_therapy(user_therapy)


@router.delete("/{user_therapy_id}", status_code=204)
async def remove_user_therapy(
    user_therapy_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserTherapy).where(
            UserTherapy.id == user_therapy_id,
            UserTherapy.user_id == current_user.id,
        )
    )
    user_therapy = result.scalar_one_or_none()
    if not user_therapy:
        raise HTTPException(status_code=404, detail="User therapy not found")

    ended_at, _user_tz = resolve_user_date(None, current_user.timezone)
    user_therapy.is_active = False
    user_therapy.ended_at = user_therapy.ended_at or ended_at
    await session.commit()
