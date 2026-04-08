import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.medication import UserMedicationResponse
from app.schemas.supplement import UserSupplementResponse
from app.schemas.therapy import UserTherapyResponse


class ProtocolScheduleBase(BaseModel):
    type: Literal["manual", "date_range", "week_of_month"]
    manual_is_active: bool | None = None
    start_date: date | None = None
    end_date: date | None = None
    weeks_of_month: list[int] | None = Field(default=None, max_length=5)

    @model_validator(mode="after")
    def validate_schedule(self):
        if self.type == "manual":
            if self.start_date or self.end_date or self.weeks_of_month:
                raise ValueError("Manual schedules only support the active toggle")
            return self

        if self.type == "date_range":
            if self.start_date is None or self.end_date is None:
                raise ValueError("Date-range schedules require both a start and end date")
            if self.start_date > self.end_date:
                raise ValueError("Schedule start date cannot be after the end date")
            if self.weeks_of_month:
                raise ValueError("Date-range schedules do not support week selections")
            return self

        if not self.weeks_of_month:
            raise ValueError("Week-of-month schedules require at least one selected week")
        unique_weeks = sorted(set(self.weeks_of_month))
        if any(week < 1 or week > 5 for week in unique_weeks):
            raise ValueError("Weeks of month must be between 1 and 5")
        self.weeks_of_month = unique_weeks
        if self.start_date or self.end_date:
            raise ValueError("Week-of-month schedules do not support date ranges")
        return self


class ProtocolScheduleInput(ProtocolScheduleBase):
    pass


class ProtocolScheduleResponse(ProtocolScheduleBase):
    pass


class ProtocolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    schedule: ProtocolScheduleInput | None = None
    user_supplement_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    user_medication_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    user_therapy_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)


class ProtocolUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None
    schedule: ProtocolScheduleInput | None = None
    user_supplement_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)
    user_medication_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)
    user_therapy_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)


class ProtocolItemResponse(BaseModel):
    id: uuid.UUID
    item_type: str
    user_supplement: UserSupplementResponse | None
    user_medication: UserMedicationResponse | None
    user_therapy: UserTherapyResponse | None
    sort_order: int

    model_config = {"from_attributes": True}


class ProtocolResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
    schedule: ProtocolScheduleResponse | None
    schedule_summary: str
    is_currently_active: bool
    items: list[ProtocolItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
