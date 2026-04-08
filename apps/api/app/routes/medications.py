import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.medication import Medication
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.medication import MedicationResponse

router = APIRouter(prefix="/medications", tags=["medications"])


@router.get("", response_model=PaginatedResponse[MedicationResponse])
async def list_medications(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    base_query = select(Medication)
    if search:
        base_query = base_query.where(Medication.name.ilike(f"%{search}%"))
    if category:
        base_query = base_query.where(Medication.category == category)

    count_result = await session.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await session.execute(base_query.order_by(Medication.name).offset(offset).limit(page_size))
    medications = list(result.scalars().all())

    return PaginatedResponse(
        items=[MedicationResponse.model_validate(medication) for medication in medications],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.get("/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Medication).where(Medication.id == medication_id))
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    return MedicationResponse.model_validate(medication)
