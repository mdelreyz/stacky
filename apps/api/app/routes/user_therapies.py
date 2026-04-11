import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.therapy import Therapy
from app.models.user import User
from app.models.user_therapy import UserTherapy
from app.schemas.common import PaginatedResponse
from app.schemas.therapy import UserTherapyCreate, UserTherapyResponse, UserTherapyUpdate
from app.services.user_item_crud import (
    create_user_owned_item,
    deactivate_user_owned_item,
    ensure_catalog_item_exists,
    ensure_no_active_duplicate,
    get_user_owned_item_or_404,
    list_user_owned_items,
    update_user_owned_item,
)
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
    return await list_user_owned_items(
        session=session,
        model=UserTherapy,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        active_only=active_only,
        serializer=serialize_user_therapy,
    )


@router.get("/{user_therapy_id}", response_model=UserTherapyResponse)
async def get_user_therapy(
    user_therapy_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_therapy = await get_user_owned_item_or_404(
        session=session,
        model=UserTherapy,
        item_id=user_therapy_id,
        user_id=current_user.id,
        not_found_detail="User therapy not found",
    )
    return await serialize_user_therapy(user_therapy)


@router.post("", response_model=UserTherapyResponse, status_code=201)
async def add_user_therapy(
    data: UserTherapyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await ensure_catalog_item_exists(
        session=session,
        model=Therapy,
        item_id=data.therapy_id,
        not_found_detail="Therapy not found",
    )
    await ensure_no_active_duplicate(
        session=session,
        model=UserTherapy,
        user_id=current_user.id,
        foreign_key_field="therapy_id",
        foreign_key_id=data.therapy_id,
        conflict_detail="Therapy already active in your protocol",
    )
    return await create_user_owned_item(
        session=session,
        model=UserTherapy,
        item_kwargs={
            "user_id": current_user.id,
            "therapy_id": data.therapy_id,
            "duration_minutes": data.duration_minutes,
            "frequency": data.frequency,
            "take_window": data.take_window,
            "settings": data.settings,
            "notes": data.notes,
            "started_at": data.started_at,
        },
        serializer=serialize_user_therapy,
    )


@router.patch("/{user_therapy_id}", response_model=UserTherapyResponse)
async def update_user_therapy(
    user_therapy_id: uuid.UUID,
    data: UserTherapyUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_therapy = await get_user_owned_item_or_404(
        session=session,
        model=UserTherapy,
        item_id=user_therapy_id,
        user_id=current_user.id,
        not_found_detail="User therapy not found",
    )
    return await update_user_owned_item(
        session=session,
        item=user_therapy,
        update_data=data.model_dump(exclude_unset=True),
        serializer=serialize_user_therapy,
    )


@router.delete("/{user_therapy_id}", status_code=204)
async def remove_user_therapy(
    user_therapy_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_therapy = await get_user_owned_item_or_404(
        session=session,
        model=UserTherapy,
        item_id=user_therapy_id,
        user_id=current_user.id,
        not_found_detail="User therapy not found",
    )
    await deactivate_user_owned_item(
        session=session,
        item=user_therapy,
        user_timezone=current_user.timezone,
    )
