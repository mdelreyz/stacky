import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import (
    ExerciseCategory,
    ExerciseEquipment,
    MuscleGroup,
    WeekDay,
)

# ─── Exercise Catalog ─────────────────────────────────────────────


class ExerciseResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    name: str
    category: ExerciseCategory
    primary_muscle: MuscleGroup
    secondary_muscles: list[str] | None
    equipment: ExerciseEquipment
    description: str | None
    instructions: str | None
    is_compound: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ExerciseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: ExerciseCategory = ExerciseCategory.compound
    primary_muscle: MuscleGroup = MuscleGroup.full_body
    secondary_muscles: list[str] | None = None
    equipment: ExerciseEquipment = ExerciseEquipment.none
    description: str | None = None
    instructions: str | None = None
    is_compound: bool = False


class ExerciseUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    category: ExerciseCategory | None = None
    primary_muscle: MuscleGroup | None = None
    secondary_muscles: list[str] | None = None
    equipment: ExerciseEquipment | None = None
    description: str | None = None
    instructions: str | None = None
    is_compound: bool | None = None


# ─── Workout Routines ─────────────────────────────────────────────


class RoutineExerciseInput(BaseModel):
    exercise_id: uuid.UUID
    sort_order: int = 0
    target_sets: int | None = None
    target_reps: int | None = None
    target_weight: float | None = None
    target_duration_seconds: int | None = None
    rest_seconds: int | None = None
    notes: str | None = None


class RoutineExerciseResponse(BaseModel):
    id: uuid.UUID
    exercise_id: uuid.UUID
    exercise: ExerciseResponse
    sort_order: int
    target_sets: int | None
    target_reps: int | None
    target_weight: float | None
    target_duration_seconds: int | None
    rest_seconds: int | None
    notes: str | None

    model_config = {"from_attributes": True}


class WorkoutRoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    estimated_duration_minutes: int | None = None
    exercises: list[RoutineExerciseInput] = []


class WorkoutRoutineUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    estimated_duration_minutes: int | None = None
    is_active: bool | None = None


class WorkoutRoutineResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None
    estimated_duration_minutes: int | None
    is_active: bool
    exercises: list[RoutineExerciseResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkoutRoutineListResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    estimated_duration_minutes: int | None
    is_active: bool
    exercise_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Exercise Regimes ─────────────────────────────────────────────


class RegimeEntryInput(BaseModel):
    routine_id: uuid.UUID
    day_of_week: WeekDay
    sort_order: int = 0


class RegimeEntryResponse(BaseModel):
    id: uuid.UUID
    routine_id: uuid.UUID
    routine: WorkoutRoutineResponse
    day_of_week: WeekDay
    sort_order: int

    model_config = {"from_attributes": True}


class ExerciseRegimeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    schedule: list[RegimeEntryInput] = []


class ExerciseRegimeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class ExerciseRegimeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
    schedule_entries: list[RegimeEntryResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Workout Sessions ─────────────────────────────────────────────


class WorkoutSetInput(BaseModel):
    set_number: int = Field(..., ge=1)
    reps: int | None = None
    weight: float | None = None
    duration_seconds: int | None = None
    rpe: float | None = Field(None, ge=1, le=10)
    is_warmup: bool = False
    is_dropset: bool = False
    notes: str | None = None


class WorkoutSetResponse(BaseModel):
    id: uuid.UUID
    set_number: int
    reps: int | None
    weight: float | None
    duration_seconds: int | None
    rpe: float | None
    is_warmup: bool
    is_dropset: bool
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkoutSetUpdate(BaseModel):
    reps: int | None = None
    weight: float | None = None
    duration_seconds: int | None = None
    rpe: float | None = Field(None, ge=1, le=10)
    is_warmup: bool | None = None
    is_dropset: bool | None = None
    notes: str | None = None


class SessionExerciseInput(BaseModel):
    exercise_id: uuid.UUID
    sort_order: int = 0
    notes: str | None = None


class SessionExerciseResponse(BaseModel):
    id: uuid.UUID
    exercise_id: uuid.UUID
    exercise: ExerciseResponse
    sort_order: int
    notes: str | None
    sets: list[WorkoutSetResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkoutSessionCreate(BaseModel):
    routine_id: uuid.UUID | None = None
    regime_id: uuid.UUID | None = None
    name: str = Field(..., min_length=1, max_length=255)
    started_at: datetime
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    location_name: str | None = None


class WorkoutSessionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    completed_at: datetime | None = None
    duration_minutes: int | None = None
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    location_name: str | None = None


class WorkoutSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    routine_id: uuid.UUID | None
    regime_id: uuid.UUID | None
    name: str
    started_at: datetime
    completed_at: datetime | None
    duration_minutes: int | None
    notes: str | None
    latitude: float | None
    longitude: float | None
    location_name: str | None
    logged_exercises: list[SessionExerciseResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkoutSessionListResponse(BaseModel):
    id: uuid.UUID
    name: str
    routine_id: uuid.UUID | None
    started_at: datetime
    completed_at: datetime | None
    duration_minutes: int | None
    location_name: str | None
    exercise_count: int
    total_sets: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Exercise Stats ───────────────────────────────────────────────


class WeeklyOverview(BaseModel):
    week: str  # ISO week e.g. "2026-W15"
    sessions: int
    total_sets: int
    total_reps: int
    total_volume: float  # weight × reps


class ExerciseProgress(BaseModel):
    exercise: ExerciseResponse
    max_weight: float | None
    estimated_1rm: float | None
    total_volume: float
    sessions_count: int
    history: list[dict]  # [{date, max_weight, volume, sets, reps}]


class MuscleGroupVolume(BaseModel):
    muscle_group: MuscleGroup
    total_volume: float
    total_sets: int
    exercise_count: int


class ExerciseStatsOverview(BaseModel):
    weekly_summary: list[WeeklyOverview]
    total_sessions: int
    total_volume: float
    favorite_exercise: str | None


# ─── Gym Locations ────────────────────────────────────────────────


class GymLocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    latitude: float
    longitude: float
    radius_meters: int = Field(100, ge=10, le=5000)
    default_routine_id: uuid.UUID | None = None


class GymLocationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    latitude: float | None = None
    longitude: float | None = None
    radius_meters: int | None = Field(None, ge=10, le=5000)
    default_routine_id: uuid.UUID | None = None
    is_active: bool | None = None


class GymLocationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    radius_meters: int
    default_routine_id: uuid.UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GymLocationMatchRequest(BaseModel):
    latitude: float
    longitude: float


class GymLocationMatchResponse(BaseModel):
    matched: bool
    gym_location: GymLocationResponse | None = None
    default_routine: WorkoutRoutineResponse | None = None
