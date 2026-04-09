import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.peptide import Peptide
from app.models.user import User
from app.models.user_peptide import UserPeptide
from app.schemas.common import PaginatedResponse
from app.schemas.peptide import UserPeptideCreate, UserPeptideResponse, UserPeptideUpdate
from app.services.daily_plan import resolve_user_date
from app.services.pagination import paginate, paginated_response
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
    query = select(UserPeptide).where(UserPeptide.user_id == current_user.id).order_by(UserPeptide.created_at.desc())
    if active_only:
        query = query.where(UserPeptide.is_active.is_(True))

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[await serialize_user_peptide(up) for up in rows],
        total=total, page=page, page_size=page_size, has_more=has_more,
    )


@router.get("/{user_peptide_id}", response_model=UserPeptideResponse)
async def get_user_peptide(
    user_peptide_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserPeptide).where(
            UserPeptide.id == user_peptide_id,
            UserPeptide.user_id == current_user.id,
        )
    )
    user_peptide = result.scalar_one_or_none()
    if not user_peptide:
        raise HTTPException(status_code=404, detail="User peptide not found")
    return await serialize_user_peptide(user_peptide)


@router.post("", response_model=UserPeptideResponse, status_code=201)
async def add_user_peptide(
    data: UserPeptideCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Peptide).where(Peptide.id == data.peptide_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Peptide not found")

    existing_result = await session.execute(
        select(UserPeptide).where(
            UserPeptide.user_id == current_user.id,
            UserPeptide.peptide_id == data.peptide_id,
            UserPeptide.is_active.is_(True),
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Peptide already active in your protocol")

    user_peptide = UserPeptide(
        user_id=current_user.id,
        peptide_id=data.peptide_id,
        dosage_amount=data.dosage_amount,
        dosage_unit=data.dosage_unit,
        frequency=data.frequency,
        take_window=data.take_window,
        with_food=data.with_food,
        route=data.route,
        reconstitution=data.reconstitution,
        storage_notes=data.storage_notes,
        notes=data.notes,
        started_at=data.started_at,
    )
    session.add(user_peptide)
    await session.commit()
    await session.refresh(user_peptide)

    return await serialize_user_peptide(user_peptide)


@router.patch("/{user_peptide_id}", response_model=UserPeptideResponse)
async def update_user_peptide(
    user_peptide_id: uuid.UUID,
    data: UserPeptideUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserPeptide).where(
            UserPeptide.id == user_peptide_id,
            UserPeptide.user_id == current_user.id,
        )
    )
    user_peptide = result.scalar_one_or_none()
    if not user_peptide:
        raise HTTPException(status_code=404, detail="User peptide not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_peptide, key, value)

    await session.commit()
    await session.refresh(user_peptide)
    return await serialize_user_peptide(user_peptide)


@router.delete("/{user_peptide_id}", status_code=204)
async def remove_user_peptide(
    user_peptide_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserPeptide).where(
            UserPeptide.id == user_peptide_id,
            UserPeptide.user_id == current_user.id,
        )
    )
    user_peptide = result.scalar_one_or_none()
    if not user_peptide:
        raise HTTPException(status_code=404, detail="User peptide not found")

    ended_at, _user_tz = resolve_user_date(None, current_user.timezone)
    user_peptide.is_active = False
    user_peptide.ended_at = user_peptide.ended_at or ended_at
    await session.commit()
