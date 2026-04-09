import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.peptide import Peptide
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.peptide import PeptideResponse
from app.services.pagination import paginate, paginated_response

router = APIRouter(prefix="/peptides", tags=["peptides"])


@router.get("", response_model=PaginatedResponse[PeptideResponse])
async def list_peptides(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    query = select(Peptide).order_by(Peptide.name)
    if search:
        query = query.where(Peptide.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Peptide.category == category)

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[PeptideResponse.model_validate(p) for p in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{peptide_id}", response_model=PeptideResponse)
async def get_peptide(
    peptide_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Peptide).where(Peptide.id == peptide_id))
    peptide = result.scalar_one_or_none()
    if not peptide:
        raise HTTPException(status_code=404, detail="Peptide not found")
    return PeptideResponse.model_validate(peptide)
