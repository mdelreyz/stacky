import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.therapy import TherapyCategory
from app.models.user_supplement import Frequency, TakeWindow


class TherapyResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: TherapyCategory
    description: str | None
    ai_profile: dict | None
    ai_generated_at: datetime | None

    model_config = {"from_attributes": True}


class UserTherapyCreate(BaseModel):
    therapy_id: uuid.UUID
    duration_minutes: int | None = Field(None, gt=0, le=1440)
    frequency: Frequency = Frequency.daily
    take_window: TakeWindow = TakeWindow.morning_with_food
    settings: dict | None = None
    notes: str | None = None
    started_at: date


class UserTherapyUpdate(BaseModel):
    duration_minutes: int | None = Field(None, gt=0, le=1440)
    frequency: Frequency | None = None
    take_window: TakeWindow | None = None
    settings: dict | None = None
    notes: str | None = None
    is_active: bool | None = None
    ended_at: date | None = None


class UserTherapyResponse(BaseModel):
    id: uuid.UUID
    therapy: TherapyResponse
    duration_minutes: int | None
    frequency: Frequency
    take_window: TakeWindow
    settings: dict | None
    notes: str | None
    is_active: bool
    started_at: date
    ended_at: date | None
    created_at: datetime

    model_config = {"from_attributes": True}
