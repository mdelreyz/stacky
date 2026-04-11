import uuid
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.daily_plan import resolve_user_date
from app.services.pagination import paginate, paginated_response

ModelT = TypeVar("ModelT")
ResponseT = TypeVar("ResponseT")
Serializer = Callable[[ModelT], Awaitable[ResponseT]]


def _user_owned_query(model: type[ModelT], user_id: uuid.UUID):
    return select(model).where(model.user_id == user_id)


async def list_user_owned_items(
    *,
    session: AsyncSession,
    model: type[ModelT],
    user_id: uuid.UUID,
    page: int,
    page_size: int,
    active_only: bool,
    serializer: Serializer[ModelT, ResponseT],
):
    query = _user_owned_query(model, user_id).order_by(model.created_at.desc())
    if active_only:
        query = query.where(model.is_active.is_(True))

    rows, total, has_more = await paginate(session, query, page, page_size)
    return paginated_response(
        items=[await serializer(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
    )


async def get_user_owned_item_or_404(
    *,
    session: AsyncSession,
    model: type[ModelT],
    item_id: uuid.UUID,
    user_id: uuid.UUID,
    not_found_detail: str,
) -> ModelT:
    result = await session.execute(_user_owned_query(model, user_id).where(model.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail=not_found_detail)
    return item


async def ensure_catalog_item_exists(
    *,
    session: AsyncSession,
    model: type[ModelT],
    item_id: uuid.UUID,
    not_found_detail: str,
) -> None:
    result = await session.execute(select(model).where(model.id == item_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=not_found_detail)


async def ensure_no_active_duplicate(
    *,
    session: AsyncSession,
    model: type[ModelT],
    user_id: uuid.UUID,
    foreign_key_field: str,
    foreign_key_id: uuid.UUID,
    conflict_detail: str,
) -> None:
    result = await session.execute(
        _user_owned_query(model, user_id).where(
            getattr(model, foreign_key_field) == foreign_key_id,
            model.is_active.is_(True),
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail=conflict_detail)


async def create_user_owned_item(
    *,
    session: AsyncSession,
    model: type[ModelT],
    item_kwargs: dict[str, Any],
    serializer: Serializer[ModelT, ResponseT],
) -> ResponseT:
    item = model(**item_kwargs)
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return await serializer(item)


async def update_user_owned_item(
    *,
    session: AsyncSession,
    item: ModelT,
    update_data: dict[str, Any],
    serializer: Serializer[ModelT, ResponseT],
) -> ResponseT:
    for key, value in update_data.items():
        setattr(item, key, value)

    await session.commit()
    await session.refresh(item)
    return await serializer(item)


async def deactivate_user_owned_item(
    *,
    session: AsyncSession,
    item: ModelT,
    user_timezone: str | None,
) -> None:
    ended_at, _user_tz = resolve_user_date(None, user_timezone)
    item.is_active = False
    item.ended_at = item.ended_at or ended_at
    await session.commit()
