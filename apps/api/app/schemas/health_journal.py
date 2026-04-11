"""Pydantic schemas for health journal entries."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HealthJournalEntryCreate(BaseModel):
    entry_date: date
    energy_level: int | None = Field(None, ge=1, le=10)
    mood_level: int | None = Field(None, ge=1, le=10)
    sleep_quality: int | None = Field(None, ge=1, le=10)
    stress_level: int | None = Field(None, ge=1, le=10)
    symptoms: list[str] | None = None
    notes: str | None = None


class HealthJournalEntryUpdate(BaseModel):
    energy_level: int | None = Field(None, ge=1, le=10)
    mood_level: int | None = Field(None, ge=1, le=10)
    sleep_quality: int | None = Field(None, ge=1, le=10)
    stress_level: int | None = Field(None, ge=1, le=10)
    symptoms: list[str] | None = None
    notes: str | None = None


class HealthJournalEntryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    entry_date: date
    energy_level: int | None = None
    mood_level: int | None = None
    sleep_quality: int | None = None
    stress_level: int | None = None
    symptoms: list[str] | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class HealthJournalSummaryResponse(BaseModel):
    start_date: date
    end_date: date
    entry_count: int
    avg_energy: float | None = None
    avg_mood: float | None = None
    avg_sleep: float | None = None
    avg_stress: float | None = None
    symptom_frequency: dict[str, int] = {}
    trend_energy: list[dict] = []
    trend_mood: list[dict] = []
    trend_sleep: list[dict] = []
