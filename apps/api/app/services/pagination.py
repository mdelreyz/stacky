from typing import TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.common import PaginatedResponse

T = TypeVar("T")


async def paginate(
    session: AsyncSession,
    query: Select,
    page: int,
    page_size: int,
) -> tuple[list, int, bool]:
    """Run a paginated query and return (rows, total, has_more).

    Callers are responsible for transforming rows into response models.
    """
    count_result = await session.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await session.execute(query.offset(offset).limit(page_size))
    rows = list(result.scalars().all())

    return rows, total, (offset + page_size) < total


def paginated_response(
    items: list[T],
    total: int,
    page: int,
    page_size: int,
    has_more: bool,
) -> PaginatedResponse[T]:
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
    )
