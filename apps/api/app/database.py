import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, TypeDecorator, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import settings


# UUID type that works with both PostgreSQL and SQLite
class UUID(TypeDecorator):
    """Platform-independent UUID type. Uses PostgreSQL's UUID on postgres, CHAR(32) on SQLite."""

    impl = String(32)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
        return value.hex if isinstance(value, uuid.UUID) else uuid.UUID(value).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


_engine_kwargs: dict = dict(echo=settings.database_echo)
if "sqlite" not in settings.database_url:
    _engine_kwargs["pool_size"] = 20
    _engine_kwargs["max_overflow"] = 10
    _engine_kwargs["pool_timeout"] = 30
    _engine_kwargs["pool_recycle"] = 3600

engine = create_async_engine(settings.database_url, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    """Provides UUID PK and audit timestamps."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


async def get_session() -> AsyncSession:
    async with async_session_factory() as session:
        yield session
