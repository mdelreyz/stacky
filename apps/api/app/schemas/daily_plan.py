from datetime import date
from typing import Literal

from pydantic import BaseModel

from app.models.user_supplement import TakeWindow


class DailyPlanItemResponse(BaseModel):
    id: str
    name: str
    type: Literal["supplement", "therapy"]
    dosage: str
    instructions: str
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
    supplement_a: str
    supplement_b: str
    type: Literal["contraindication", "caution"]
    severity: Literal["critical", "major", "moderate", "minor"]
    description: str


class DailyPlanResponse(BaseModel):
    date: date
    windows: list[TakeWindowPlanResponse]
    nutrition_phase: str | None
    cycle_alerts: list[CycleAlertResponse]
    interactions: list[InteractionWarningResponse]
