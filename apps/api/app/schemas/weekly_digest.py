"""Pydantic schemas for weekly digest."""

from datetime import date

from pydantic import BaseModel


class DailyAdherenceRate(BaseModel):
    date: date
    taken: int
    total: int
    rate: float | None = None


class DigestAdherence(BaseModel):
    taken_count: int
    skipped_count: int
    total_logged: int
    completion_rate: float
    daily_rates: list[DailyAdherenceRate]
    best_day: date | None = None
    worst_day: date | None = None


class DigestJournal(BaseModel):
    entry_count: int
    avg_energy: float | None = None
    avg_mood: float | None = None
    avg_sleep: float | None = None
    avg_stress: float | None = None
    symptom_frequency: dict[str, int] = {}


class DigestExercise(BaseModel):
    session_count: int
    total_sets: int
    total_volume: float


class WeeklyDigestResponse(BaseModel):
    week_start: date
    week_end: date
    adherence: DigestAdherence
    journal: DigestJournal
    exercise: DigestExercise
    highlights: list[str]
