import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.medication import Medication
from app.models.user import User
from app.models.user_medication import UserMedication
from app.schemas.common import PaginatedResponse
from app.schemas.medication import UserMedicationCreate, UserMedicationResponse, UserMedicationUpdate
from app.services.user_item_crud import (
    create_user_owned_item,
    deactivate_user_owned_item,
    ensure_catalog_item_exists,
    ensure_no_active_duplicate,
    get_user_owned_item_or_404,
    list_user_owned_items,
    update_user_owned_item,
)
from app.services.user_medication_serialization import serialize_user_medication

router = APIRouter(prefix="/users/me/medications", tags=["user-medications"])


@router.get("", response_model=PaginatedResponse[UserMedicationResponse])
async def list_user_medications(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await list_user_owned_items(
        session=session,
        model=UserMedication,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        active_only=active_only,
        serializer=serialize_user_medication,
    )


@router.get("/{user_medication_id}", response_model=UserMedicationResponse)
async def get_user_medication(
    user_medication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_medication = await get_user_owned_item_or_404(
        session=session,
        model=UserMedication,
        item_id=user_medication_id,
        user_id=current_user.id,
        not_found_detail="User medication not found",
    )
    return await serialize_user_medication(user_medication)


@router.post("", response_model=UserMedicationResponse, status_code=201)
async def add_user_medication(
    data: UserMedicationCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await ensure_catalog_item_exists(
        session=session,
        model=Medication,
        item_id=data.medication_id,
        not_found_detail="Medication not found",
    )
    await ensure_no_active_duplicate(
        session=session,
        model=UserMedication,
        user_id=current_user.id,
        foreign_key_field="medication_id",
        foreign_key_id=data.medication_id,
        conflict_detail="Medication already active in your protocol",
    )
    return await create_user_owned_item(
        session=session,
        model=UserMedication,
        item_kwargs={
            "user_id": current_user.id,
            "medication_id": data.medication_id,
            "dosage_amount": data.dosage_amount,
            "dosage_unit": data.dosage_unit,
            "frequency": data.frequency,
            "take_window": data.take_window,
            "with_food": data.with_food,
            "notes": data.notes,
            "started_at": data.started_at,
        },
        serializer=serialize_user_medication,
    )


@router.patch("/{user_medication_id}", response_model=UserMedicationResponse)
async def update_user_medication(
    user_medication_id: uuid.UUID,
    data: UserMedicationUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_medication = await get_user_owned_item_or_404(
        session=session,
        model=UserMedication,
        item_id=user_medication_id,
        user_id=current_user.id,
        not_found_detail="User medication not found",
    )
    return await update_user_owned_item(
        session=session,
        item=user_medication,
        update_data=data.model_dump(exclude_unset=True),
        serializer=serialize_user_medication,
    )


@router.delete("/{user_medication_id}", status_code=204)
async def remove_user_medication(
    user_medication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_medication = await get_user_owned_item_or_404(
        session=session,
        model=UserMedication,
        item_id=user_medication_id,
        user_id=current_user.id,
        not_found_detail="User medication not found",
    )
    await deactivate_user_owned_item(
        session=session,
        item=user_medication,
        user_timezone=current_user.timezone,
    )
