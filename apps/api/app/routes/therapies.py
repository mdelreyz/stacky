import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.therapy import Therapy
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.therapy import TherapyResponse

router = APIRouter(prefix="/therapies", tags=["therapies"])


@router.get("", response_model=PaginatedResponse[TherapyResponse])
async def list_therapies(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    base_query = select(Therapy)
    if search:
        base_query = base_query.where(Therapy.name.ilike(f"%{search}%"))
    if category:
        base_query = base_query.where(Therapy.category == category)

    count_result = await session.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await session.execute(base_query.order_by(Therapy.name).offset(offset).limit(page_size))
    therapies = list(result.scalars().all())

    return PaginatedResponse(
        items=[TherapyResponse.model_validate(therapy) for therapy in therapies],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.get("/{therapy_id}", response_model=TherapyResponse)
async def get_therapy(
    therapy_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Therapy).where(Therapy.id == therapy_id))
    therapy = result.scalar_one_or_none()
    if not therapy:
        raise HTTPException(status_code=404, detail="Therapy not found")
    return TherapyResponse.model_validate(therapy)
