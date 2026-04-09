import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.medication import Medication
from app.models.user import User
from app.models.user_medication import UserMedication
from app.schemas.common import PaginatedResponse
from app.schemas.medication import UserMedicationCreate, UserMedicationResponse, UserMedicationUpdate
from app.services.daily_plan import resolve_user_date
from app.services.pagination import paginate, paginated_response
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
    query = select(UserMedication).where(UserMedication.user_id == current_user.id).order_by(UserMedication.created_at.desc())
    if active_only:
        query = query.where(UserMedication.is_active.is_(True))

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[await serialize_user_medication(um) for um in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{user_medication_id}", response_model=UserMedicationResponse)
async def get_user_medication(
    user_medication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserMedication).where(
            UserMedication.id == user_medication_id,
            UserMedication.user_id == current_user.id,
        )
    )
    user_medication = result.scalar_one_or_none()
    if not user_medication:
        raise HTTPException(status_code=404, detail="User medication not found")
    return await serialize_user_medication(user_medication)


@router.post("", response_model=UserMedicationResponse, status_code=201)
async def add_user_medication(
    data: UserMedicationCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Medication).where(Medication.id == data.medication_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Medication not found")

    existing_result = await session.execute(
        select(UserMedication).where(
            UserMedication.user_id == current_user.id,
            UserMedication.medication_id == data.medication_id,
            UserMedication.is_active.is_(True),
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Medication already active in your protocol")

    user_medication = UserMedication(
        user_id=current_user.id,
        medication_id=data.medication_id,
        dosage_amount=data.dosage_amount,
        dosage_unit=data.dosage_unit,
        frequency=data.frequency,
        take_window=data.take_window,
        with_food=data.with_food,
        notes=data.notes,
        started_at=data.started_at,
    )
    session.add(user_medication)
    await session.commit()
    await session.refresh(user_medication)

    return await serialize_user_medication(user_medication)


@router.patch("/{user_medication_id}", response_model=UserMedicationResponse)
async def update_user_medication(
    user_medication_id: uuid.UUID,
    data: UserMedicationUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserMedication).where(
            UserMedication.id == user_medication_id,
            UserMedication.user_id == current_user.id,
        )
    )
    user_medication = result.scalar_one_or_none()
    if not user_medication:
        raise HTTPException(status_code=404, detail="User medication not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_medication, key, value)

    await session.commit()
    await session.refresh(user_medication)
    return await serialize_user_medication(user_medication)


@router.delete("/{user_medication_id}", status_code=204)
async def remove_user_medication(
    user_medication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserMedication).where(
            UserMedication.id == user_medication_id,
            UserMedication.user_id == current_user.id,
        )
    )
    user_medication = result.scalar_one_or_none()
    if not user_medication:
        raise HTTPException(status_code=404, detail="User medication not found")

    ended_at, _user_tz = resolve_user_date(None, current_user.timezone)
    user_medication.is_active = False
    user_medication.ended_at = user_medication.ended_at or ended_at
    await session.commit()
