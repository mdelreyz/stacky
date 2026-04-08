import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_session
from app.models.protocol import Protocol, ProtocolItem
from app.models.user import User
from app.models.user_supplement import UserSupplement
from app.schemas.common import PaginatedResponse
from app.schemas.protocol import ProtocolCreate, ProtocolItemResponse, ProtocolResponse, ProtocolUpdate
from app.services.user_supplement_serialization import serialize_user_supplement

router = APIRouter(prefix="/users/me/protocols", tags=["protocols"])


def _dedupe_ids(ids: list[uuid.UUID]) -> list[uuid.UUID]:
    ordered: list[uuid.UUID] = []
    seen: set[uuid.UUID] = set()
    for item_id in ids:
        if item_id in seen:
            raise HTTPException(status_code=400, detail="Protocol cannot contain duplicate supplements")
        seen.add(item_id)
        ordered.append(item_id)
    return ordered

async def _serialize_protocol(protocol: Protocol) -> ProtocolResponse:
    items: list[ProtocolItemResponse] = []
    for item in protocol.items:
        items.append(
            ProtocolItemResponse(
                id=item.id,
                item_type=item.item_type,
                user_supplement=await serialize_user_supplement(item.user_supplement),
                user_therapy=None,
                sort_order=item.sort_order,
            )
        )

    return ProtocolResponse(
        id=protocol.id,
        name=protocol.name,
        description=protocol.description,
        is_active=protocol.is_active,
        items=items,
        created_at=protocol.created_at,
    )


def _protocol_query_for_user(user_id: uuid.UUID):
    return (
        select(Protocol)
        .where(Protocol.user_id == user_id)
        .options(
            selectinload(Protocol.items)
            .selectinload(ProtocolItem.user_supplement)
            .selectinload(UserSupplement.supplement)
        )
    )


async def _resolve_user_supplements(
    session: AsyncSession,
    current_user: User,
    user_supplement_ids: list[uuid.UUID],
) -> list[UserSupplement]:
    ordered_ids = _dedupe_ids(user_supplement_ids)
    result = await session.execute(
        select(UserSupplement)
        .where(
            UserSupplement.user_id == current_user.id,
            UserSupplement.id.in_(ordered_ids),
        )
        .options(selectinload(UserSupplement.supplement))
    )
    user_supplements = list(result.scalars().all())
    supplements_by_id = {user_supplement.id: user_supplement for user_supplement in user_supplements}

    missing_ids = [item_id for item_id in ordered_ids if item_id not in supplements_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail="Protocol items must reference supplements in your account",
        )

    return [supplements_by_id[item_id] for item_id in ordered_ids]


async def _replace_protocol_items(
    session: AsyncSession,
    protocol: Protocol,
    user_supplement_ids: list[uuid.UUID],
    current_user: User,
) -> None:
    user_supplements = await _resolve_user_supplements(session, current_user, user_supplement_ids)

    await session.execute(delete(ProtocolItem).where(ProtocolItem.protocol_id == protocol.id))

    for index, user_supplement in enumerate(user_supplements):
        session.add(
            ProtocolItem(
                protocol_id=protocol.id,
                item_type="supplement",
                user_supplement_id=user_supplement.id,
                sort_order=index,
            )
        )


@router.get("", response_model=PaginatedResponse[ProtocolResponse])
async def list_protocols(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    base_query = _protocol_query_for_user(current_user.id)
    if active_only:
        base_query = base_query.where(Protocol.is_active.is_(True))

    count_result = await session.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await session.execute(base_query.order_by(Protocol.created_at.desc()).offset(offset).limit(page_size))
    protocols = list(result.scalars().all())

    return PaginatedResponse(
        items=[await _serialize_protocol(protocol) for protocol in protocols],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.get("/{protocol_id}", response_model=ProtocolResponse)
async def get_protocol(
    protocol_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol_id)
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    return await _serialize_protocol(protocol)


@router.post("", response_model=ProtocolResponse, status_code=201)
async def create_protocol(
    data: ProtocolCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    protocol = Protocol(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
    )
    session.add(protocol)
    await session.flush()
    await _replace_protocol_items(session, protocol, data.user_supplement_ids, current_user)
    await session.commit()

    result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol.id)
    )
    created_protocol = result.scalar_one()
    return await _serialize_protocol(created_protocol)


@router.patch("/{protocol_id}", response_model=ProtocolResponse)
async def update_protocol(
    protocol_id: uuid.UUID,
    data: ProtocolUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol_id)
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    update_data = data.model_dump(exclude_unset=True)
    user_supplement_ids = update_data.pop("user_supplement_ids", None)
    for key, value in update_data.items():
        setattr(protocol, key, value)

    if user_supplement_ids is not None:
        await _replace_protocol_items(session, protocol, user_supplement_ids, current_user)

    await session.commit()

    refreshed_result = await session.execute(
        _protocol_query_for_user(current_user.id).where(Protocol.id == protocol.id)
    )
    updated_protocol = refreshed_result.scalar_one()
    return await _serialize_protocol(updated_protocol)


@router.delete("/{protocol_id}", status_code=204)
async def delete_protocol(
    protocol_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Protocol).where(
            Protocol.id == protocol_id,
            Protocol.user_id == current_user.id,
        )
    )
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    await session.delete(protocol)
    await session.commit()
