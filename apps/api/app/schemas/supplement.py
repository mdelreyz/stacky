import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.supplement import SupplementCategory
from app.models.user_supplement import Frequency, TakeWindow


# ---------- Supplement catalog ----------


class SupplementResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: SupplementCategory
    form: str | None
    description: str | None
    ai_profile: dict | None
    ai_generated_at: datetime | None
    is_verified: bool

    model_config = {"from_attributes": True}


class SupplementOnboardRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: SupplementCategory | None = None
    form: str | None = None


class SupplementOnboardResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str  # "ready", "generating", "failed"
    ai_profile: dict | None

    model_config = {"from_attributes": True}


# ---------- User supplements ----------


class UserSupplementCreate(BaseModel):
    supplement_id: uuid.UUID
    dosage_amount: float = Field(..., gt=0)
    dosage_unit: str = Field(..., min_length=1, max_length=30)
    frequency: Frequency = Frequency.daily
    take_window: TakeWindow = TakeWindow.morning_with_food
    with_food: bool = False
    notes: str | None = None
    started_at: date


class UserSupplementUpdate(BaseModel):
    dosage_amount: float | None = Field(None, gt=0)
    dosage_unit: str | None = Field(None, min_length=1, max_length=30)
    frequency: Frequency | None = None
    take_window: TakeWindow | None = None
    with_food: bool | None = None
    notes: str | None = None
    is_active: bool | None = None
    ended_at: date | None = None


class UserSupplementResponse(BaseModel):
    id: uuid.UUID
    supplement: SupplementResponse
    dosage_amount: float
    dosage_unit: str
    frequency: Frequency
    take_window: TakeWindow
    with_food: bool
    notes: str | None
    is_active: bool
    started_at: date
    ended_at: date | None
    created_at: datetime

    model_config = {"from_attributes": True}
