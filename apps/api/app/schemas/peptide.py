import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.peptide import PeptideCategory
from app.models.enums import Frequency, TakeWindow


# ---------- Peptide catalog ----------


class PeptideResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: PeptideCategory
    form: str | None
    description: str | None
    goals: list[str] | None
    mechanism_tags: list[str] | None
    ai_profile: dict | None
    ai_generated_at: datetime | None
    is_verified: bool

    model_config = {"from_attributes": True}


# ---------- User peptides ----------


class UserPeptideCreate(BaseModel):
    peptide_id: uuid.UUID
    dosage_amount: float = Field(..., gt=0)
    dosage_unit: str = Field(..., min_length=1, max_length=30)
    frequency: Frequency = Frequency.daily
    take_window: TakeWindow = TakeWindow.morning_fasted
    with_food: bool = False
    route: str | None = None
    reconstitution: dict | None = None
    storage_notes: str | None = None
    notes: str | None = None
    started_at: date


class UserPeptideUpdate(BaseModel):
    dosage_amount: float | None = Field(None, gt=0)
    dosage_unit: str | None = Field(None, min_length=1, max_length=30)
    frequency: Frequency | None = None
    take_window: TakeWindow | None = None
    with_food: bool | None = None
    route: str | None = None
    reconstitution: dict | None = None
    storage_notes: str | None = None
    notes: str | None = None
    is_active: bool | None = None
    ended_at: date | None = None


class UserPeptideResponse(BaseModel):
    id: uuid.UUID
    peptide: PeptideResponse
    dosage_amount: float
    dosage_unit: str
    frequency: Frequency
    take_window: TakeWindow
    with_food: bool
    route: str | None
    reconstitution: dict | None
    storage_notes: str | None
    notes: str | None
    is_active: bool
    started_at: date
    ended_at: date | None
    created_at: datetime

    model_config = {"from_attributes": True}
