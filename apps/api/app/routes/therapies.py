import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.therapy import Therapy
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.therapy import TherapyResponse
from app.services.pagination import paginate, paginated_response

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
    query = select(Therapy).order_by(Therapy.name)
    if search:
        query = query.where(Therapy.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Therapy.category == category)

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[TherapyResponse.model_validate(t) for t in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
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
