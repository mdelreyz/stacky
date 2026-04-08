import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

NutritionCycleType = Literal["macro_profile", "named_diet", "elimination", "custom"]
MacroLevel = Literal["low", "medium", "high"]


class NutritionMacroProfile(BaseModel):
    carbs: MacroLevel
    protein: MacroLevel
    fat: MacroLevel


class NutritionPhasePayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    duration_days: int = Field(gt=0, le=365)
    macro_profile: NutritionMacroProfile | None = None
    pattern: str | None = Field(default=None, max_length=120)
    restrictions: list[str] = Field(default_factory=list)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_phase_shape(self):
        has_macro_profile = self.macro_profile is not None
        has_pattern = bool(self.pattern and self.pattern.strip())
        has_restrictions = any(item.strip() for item in self.restrictions)
        has_notes = bool(self.notes and self.notes.strip())

        if not (has_macro_profile or has_pattern or has_restrictions or has_notes):
            raise ValueError("Each nutrition phase needs macro targets, a named pattern, restrictions, or notes")
        return self


class NutritionCycleCreate(BaseModel):
    cycle_type: NutritionCycleType
    name: str = Field(min_length=1, max_length=255)
    phases: list[NutritionPhasePayload] = Field(min_length=1, max_length=12)
    phase_started_at: date


class NutritionCycleUpdate(BaseModel):
    cycle_type: NutritionCycleType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phases: list[NutritionPhasePayload] | None = Field(default=None, min_length=1, max_length=12)
    phase_started_at: date | None = None
    is_active: bool | None = None


class NutritionPhaseResponse(NutritionPhasePayload):
    pass


class ActiveNutritionPhaseResponse(NutritionPhaseResponse):
    plan_name: str
    cycle_type: NutritionCycleType
    current_phase_idx: int
    total_phases: int
    next_transition: date
    days_until_transition: int


class NutritionCycleResponse(BaseModel):
    id: uuid.UUID
    cycle_type: NutritionCycleType
    name: str
    phases: list[NutritionPhaseResponse]
    current_phase_idx: int
    phase_started_at: date
    next_transition: date
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
