from datetime import datetime, timezone
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = 1
    page_size: int = 50
    has_more: bool = False


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None


class HealthStatus(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
