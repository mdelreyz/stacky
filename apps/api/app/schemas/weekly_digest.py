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


class DigestMetricDelta(BaseModel):
    current: int | float | None = None
    previous: int | float | None = None
    delta: int | float | None = None


class WeeklyDigestComparison(BaseModel):
    previous_week_start: date
    previous_week_end: date
    adherence_completion_rate: DigestMetricDelta
    journal_entry_count: DigestMetricDelta
    journal_avg_energy: DigestMetricDelta
    exercise_session_count: DigestMetricDelta
    exercise_total_volume: DigestMetricDelta


class MonthlyDigestComparison(BaseModel):
    current_month_start: date
    current_month_end: date
    previous_month_start: date
    previous_month_end: date
    adherence_completion_rate: DigestMetricDelta
    journal_entry_count: DigestMetricDelta
    journal_avg_energy: DigestMetricDelta
    exercise_session_count: DigestMetricDelta
    exercise_total_volume: DigestMetricDelta


class WeeklyDigestResponse(BaseModel):
    week_start: date
    week_end: date
    adherence: DigestAdherence
    journal: DigestJournal
    exercise: DigestExercise
    highlights: list[str]
    comparison: WeeklyDigestComparison
    monthly_comparison: MonthlyDigestComparison
