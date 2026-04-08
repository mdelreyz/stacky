from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.models.user_supplement import TakeWindow


class TrackingEventResponse(BaseModel):
    item_id: str
    item_name: str
    item_type: Literal["supplement", "medication", "therapy"]
    take_window: TakeWindow | None
    status: Literal["taken", "skipped"]
    scheduled_at: datetime
    taken_at: datetime | None
    skip_reason: str | None
    regimes: list[str]


class TrackingSuggestionResponse(BaseModel):
    item_id: str | None
    item_name: str | None
    item_type: Literal["supplement", "medication", "therapy", "overall"]
    headline: str
    recommendation: str


class TrackingItemStatResponse(BaseModel):
    item_id: str
    item_name: str
    item_type: Literal["supplement", "medication", "therapy"]
    take_window: TakeWindow
    regimes: list[str]
    scheduled_count: int
    taken_count: int
    skipped_count: int
    pending_count: int
    completion_rate: float
    last_taken_at: datetime | None


class TrackingOverviewResponse(BaseModel):
    window_days: int
    start_date: date
    end_date: date
    item_type_filter: Literal["supplement", "medication", "therapy"] | None
    scheduled_count: int
    taken_count: int
    skipped_count: int
    pending_count: int
    completion_rate: float
    current_streak_days: int
    item_stats: list[TrackingItemStatResponse]
    recent_events: list[TrackingEventResponse]
    suggestions: list[TrackingSuggestionResponse]
