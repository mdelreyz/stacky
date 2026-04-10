import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.models.supplement import Supplement


def supplement_visibility_clause(user_id: uuid.UUID) -> ColumnElement[bool]:
    return or_(Supplement.created_by_user_id.is_(None), Supplement.created_by_user_id == user_id)


async def get_visible_supplement(
    session: AsyncSession,
    supplement_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Supplement | None:
    result = await session.execute(
        select(Supplement).where(
            Supplement.id == supplement_id,
            supplement_visibility_clause(user_id),
        )
    )
    return result.scalar_one_or_none()
