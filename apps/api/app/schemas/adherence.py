from datetime import date as date_type
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SupplementAdherenceUpdateRequest(BaseModel):
    status: Literal["taken", "skipped"]
    date: date_type | None = None
    skip_reason: str | None = Field(None, max_length=500)


class SupplementAdherenceResponse(BaseModel):
    item_id: str
    status: Literal["taken", "skipped"]
    scheduled_at: datetime
    taken_at: datetime | None
    skip_reason: str | None
