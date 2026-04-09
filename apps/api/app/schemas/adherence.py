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


AdherenceUpdateRequest = SupplementAdherenceUpdateRequest
AdherenceResponse = SupplementAdherenceResponse


class BatchAdherenceRequest(BaseModel):
    status: Literal["taken", "skipped"]
    date: date_type | None = None
    skip_reason: str | None = Field(None, max_length=500)


class BatchAdherenceItemResult(BaseModel):
    item_id: str
    item_type: str
    item_name: str
    status: Literal["taken", "skipped"]
    scheduled_at: datetime
    taken_at: datetime | None
    skip_reason: str | None


class BatchAdherenceResponse(BaseModel):
    protocol_id: str
    protocol_name: str
    date: date_type
    status: Literal["taken", "skipped"]
    items_marked: list[BatchAdherenceItemResult]
    items_not_due: list[str]
