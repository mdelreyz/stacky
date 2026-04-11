import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.peptide import Peptide
from app.models.user import User
from app.models.user_peptide import UserPeptide
from app.schemas.common import PaginatedResponse
from app.schemas.peptide import UserPeptideCreate, UserPeptideResponse, UserPeptideUpdate
from app.services.user_item_crud import (
    create_user_owned_item,
    deactivate_user_owned_item,
    ensure_catalog_item_exists,
    ensure_no_active_duplicate,
    get_user_owned_item_or_404,
    list_user_owned_items,
    update_user_owned_item,
)
from app.services.user_peptide_serialization import serialize_user_peptide

router = APIRouter(prefix="/users/me/peptides", tags=["user-peptides"])


@router.get("", response_model=PaginatedResponse[UserPeptideResponse])
async def list_user_peptides(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await list_user_owned_items(
        session=session,
        model=UserPeptide,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        active_only=active_only,
        serializer=serialize_user_peptide,
    )


@router.get("/{user_peptide_id}", response_model=UserPeptideResponse)
async def get_user_peptide(
    user_peptide_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_peptide = await get_user_owned_item_or_404(
        session=session,
        model=UserPeptide,
        item_id=user_peptide_id,
        user_id=current_user.id,
        not_found_detail="User peptide not found",
    )
    return await serialize_user_peptide(user_peptide)


@router.post("", response_model=UserPeptideResponse, status_code=201)
async def add_user_peptide(
    data: UserPeptideCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await ensure_catalog_item_exists(
        session=session,
        model=Peptide,
        item_id=data.peptide_id,
        not_found_detail="Peptide not found",
    )
    await ensure_no_active_duplicate(
        session=session,
        model=UserPeptide,
        user_id=current_user.id,
        foreign_key_field="peptide_id",
        foreign_key_id=data.peptide_id,
        conflict_detail="Peptide already active in your protocol",
    )
    return await create_user_owned_item(
        session=session,
        model=UserPeptide,
        item_kwargs={
            "user_id": current_user.id,
            "peptide_id": data.peptide_id,
            "dosage_amount": data.dosage_amount,
            "dosage_unit": data.dosage_unit,
            "frequency": data.frequency,
            "take_window": data.take_window,
            "with_food": data.with_food,
            "route": data.route,
            "reconstitution": data.reconstitution,
            "storage_notes": data.storage_notes,
            "notes": data.notes,
            "started_at": data.started_at,
        },
        serializer=serialize_user_peptide,
    )


@router.patch("/{user_peptide_id}", response_model=UserPeptideResponse)
async def update_user_peptide(
    user_peptide_id: uuid.UUID,
    data: UserPeptideUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_peptide = await get_user_owned_item_or_404(
        session=session,
        model=UserPeptide,
        item_id=user_peptide_id,
        user_id=current_user.id,
        not_found_detail="User peptide not found",
    )
    return await update_user_owned_item(
        session=session,
        item=user_peptide,
        update_data=data.model_dump(exclude_unset=True),
        serializer=serialize_user_peptide,
    )


@router.delete("/{user_peptide_id}", status_code=204)
async def remove_user_peptide(
    user_peptide_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_peptide = await get_user_owned_item_or_404(
        session=session,
        model=UserPeptide,
        item_id=user_peptide_id,
        user_id=current_user.id,
        not_found_detail="User peptide not found",
    )
    await deactivate_user_owned_item(
        session=session,
        item=user_peptide,
        user_timezone=current_user.timezone,
    )
