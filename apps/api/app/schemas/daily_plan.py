from datetime import date
from typing import Literal

from pydantic import BaseModel

from app.models.enums import TakeWindow
from app.schemas.nutrition import ActiveNutritionPhaseResponse


class DailyPlanItemResponse(BaseModel):
    id: str
    name: str
    type: Literal["supplement", "medication", "therapy"]
    details: str | None
    instructions: str
    regimes: list[str]
    is_on_cycle: bool
    adherence_status: Literal["pending", "taken", "skipped"]


class TakeWindowPlanResponse(BaseModel):
    window: TakeWindow
    display_time: str
    items: list[DailyPlanItemResponse]


class CycleAlertResponse(BaseModel):
    item_name: str
    message: str
    days_until_transition: int


class InteractionWarningResponse(BaseModel):
    item_a: str
    item_b: str
    type: Literal["contraindication", "caution"]
    severity: Literal["critical", "major", "moderate", "minor"]
    description: str


class SkincareGuidanceResponse(BaseModel):
    location_name: str
    uv_index: float
    level: Literal["low", "moderate", "high", "very_high"]
    is_day: bool
    recommended_spf: int | None
    reapply_hours: int | None
    headline: str
    recommendation: str


class ExercisePlanItemResponse(BaseModel):
    routine_id: str
    routine_name: str
    exercise_count: int
    estimated_duration_minutes: int | None
    regime_name: str
    status: Literal["pending", "in_progress", "completed"]


class DailyPlanResponse(BaseModel):
    date: date
    windows: list[TakeWindowPlanResponse]
    exercise_plan: list[ExercisePlanItemResponse]
    nutrition_phase: ActiveNutritionPhaseResponse | None
    skincare_guidance: SkincareGuidanceResponse | None
    cycle_alerts: list[CycleAlertResponse]
    interactions: list[InteractionWarningResponse]
