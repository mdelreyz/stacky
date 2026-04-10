import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


InteractionModeType = Literal["expert", "advanced", "automated", "guided"]
HealthGoalType = Literal[
    "longevity", "cognitive", "sleep", "stress", "energy", "immunity",
    "skin", "hair", "joint_health", "gut_health", "weight_management",
    "muscle_recovery", "cardiovascular", "hormonal_balance",
]


class UserPreferencesCreate(BaseModel):
    interaction_mode: InteractionModeType = "guided"
    max_supplements_per_day: int | None = Field(None, ge=1, le=100)
    max_tablets_per_day: int | None = Field(None, ge=1, le=50)
    max_medications: int | None = Field(None, ge=0, le=100)
    exercise_blocks_per_week: int | None = Field(None, ge=0, le=14)
    exercise_minutes_per_day: int | None = Field(None, ge=0, le=300)
    primary_goals: list[HealthGoalType] | None = Field(None, max_length=5)
    focus_concerns: list[str] | None = Field(None, max_length=10)
    excluded_ingredients: list[str] | None = Field(None, max_length=50)
    age: int | None = Field(None, ge=13, le=120)
    biological_sex: Literal["male", "female", "other"] | None = None
    notes: str | None = Field(None, max_length=1000)


class UserPreferencesUpdate(BaseModel):
    interaction_mode: InteractionModeType | None = None
    max_supplements_per_day: int | None = Field(None, ge=1, le=100)
    max_tablets_per_day: int | None = Field(None, ge=1, le=50)
    max_medications: int | None = Field(None, ge=0, le=100)
    exercise_blocks_per_week: int | None = Field(None, ge=0, le=14)
    exercise_minutes_per_day: int | None = Field(None, ge=0, le=300)
    primary_goals: list[HealthGoalType] | None = Field(None, max_length=5)
    focus_concerns: list[str] | None = Field(None, max_length=10)
    excluded_ingredients: list[str] | None = Field(None, max_length=50)
    age: int | None = Field(None, ge=13, le=120)
    biological_sex: Literal["male", "female", "other"] | None = None
    notes: str | None = Field(None, max_length=1000)


class UserPreferencesResponse(BaseModel):
    id: uuid.UUID
    interaction_mode: InteractionModeType
    max_supplements_per_day: int | None
    max_tablets_per_day: int | None
    max_medications: int | None
    exercise_blocks_per_week: int | None
    exercise_minutes_per_day: int | None
    primary_goals: list[str] | None
    focus_concerns: list[str] | None
    excluded_ingredients: list[str] | None
    age: int | None
    biological_sex: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecommendationRequest(BaseModel):
    """Request a slot-constrained, goal-aware recommendation from the AI."""
    max_items: int = Field(5, ge=1, le=20, description="How many items to recommend")
    goals: list[HealthGoalType] | None = Field(None, description="Override goals (defaults to user preferences)")
    focus_concern: str | None = Field(None, max_length=500, description="Specific concern like 'brain fog' or 'joint pain'")
    item_types: list[Literal["supplement", "medication", "therapy", "peptide"]] = Field(
        default=["supplement"], description="Which item types to include"
    )
    exclude_current: bool = Field(True, description="Exclude items the user already takes")


class RecommendedItem(BaseModel):
    catalog_id: str
    item_type: str
    name: str
    category: str
    reason: str
    priority_rank: int
    suggested_dosage: str | None = None
    suggested_window: str | None = None


class RecommendationResponse(BaseModel):
    items: list[RecommendedItem]
    reasoning_summary: str
    goals_used: list[str]
    slot_budget: int
    items_excluded_current: int = 0


class ApplyRecommendationItem(BaseModel):
    catalog_id: uuid.UUID
    item_type: Literal["supplement", "medication", "therapy", "peptide"]
    dosage_amount: float | None = Field(None, gt=0)
    dosage_unit: str | None = Field(None, min_length=1, max_length=30)
    take_window: str | None = None
    frequency: str = "daily"


class ApplyRecommendationsRequest(BaseModel):
    items: list[ApplyRecommendationItem] = Field(..., min_length=1, max_length=20)
    protocol_name: str | None = Field(None, max_length=255, description="If set, groups all items into a named protocol")
    started_at: str | None = None


class AppliedItem(BaseModel):
    user_item_id: str
    item_type: str
    catalog_id: str
    name: str


class ApplyRecommendationsResponse(BaseModel):
    applied: list[AppliedItem]
    protocol_id: str | None = None
    protocol_name: str | None = None


class InteractionWarning(BaseModel):
    item_a: str
    item_b: str
    interaction_type: Literal["contraindication", "caution"]
    severity: Literal["critical", "major", "moderate", "minor"]
    description: str


class InteractionCheckResponse(BaseModel):
    warnings: list[InteractionWarning]
    has_critical: bool
    has_major: bool
    total_warnings: int


# ── Stack Score ─────────────────────────────────────────────────────


class ScoreDimensionResponse(BaseModel):
    name: str
    score: float
    weight: float
    details: str


class SynergyPairResponse(BaseModel):
    item_a: str
    item_b: str
    benefit: str


class StackScoreResponse(BaseModel):
    total_score: int
    dimensions: list[ScoreDimensionResponse]
    synergies_found: list[SynergyPairResponse]
    suggestions: list[str]
    item_count: int


# ── Guided Wizard ───────────────────────────────────────────────────


class WizardTurnSchema(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class WizardRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation: list[WizardTurnSchema] = Field(default_factory=list)


class WizardRecommendedItem(BaseModel):
    catalog_id: str
    name: str
    item_type: str
    reason: str
    suggested_dosage: str | None = None
    suggested_window: str | None = None


class WizardResponse(BaseModel):
    assistant_message: str
    conversation: list[WizardTurnSchema]
    is_complete: bool
    extracted_preferences: dict | None = None
    recommended_items: list[WizardRecommendedItem] | None = None
    protocol_name: str | None = None
    summary: str | None = None
