import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ─── Notification Preferences ────────────────────────────────────


class NotificationPreferencesResponse(BaseModel):
    id: uuid.UUID
    enabled: bool
    window_times: dict[str, str] | None
    enabled_windows: list[str] | None
    quiet_start: str | None
    quiet_end: str | None
    advance_minutes: int | None
    snooze_minutes: int | None
    streak_reminders: bool
    refill_reminders: bool
    interaction_alerts: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationPreferencesUpdate(BaseModel):
    enabled: bool | None = None
    window_times: dict[str, str] | None = None
    enabled_windows: list[str] | None = None
    quiet_start: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    quiet_end: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    advance_minutes: int | None = Field(None, ge=0, le=60)
    snooze_minutes: int | None = Field(None, ge=1, le=60)
    streak_reminders: bool | None = None
    refill_reminders: bool | None = None
    interaction_alerts: bool | None = None


# ─── Push Tokens ─────────────────────────────────────────────────


class PushTokenResponse(BaseModel):
    id: uuid.UUID
    token: str
    device_id: str | None
    platform: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PushTokenCreate(BaseModel):
    token: str = Field(..., min_length=1, max_length=255)
    device_id: str | None = Field(None, max_length=255)
    platform: str | None = Field(None, pattern=r"^(ios|android|web)$")


# ─── Reminder Schedule ───────────────────────────────────────────


class ReminderScheduleItem(BaseModel):
    window: str
    scheduled_time: str
    items_count: int
    item_names: list[str]


class ReminderScheduleResponse(BaseModel):
    date: str
    reminders: list[ReminderScheduleItem]
    quiet_start: str | None
    quiet_end: str | None
