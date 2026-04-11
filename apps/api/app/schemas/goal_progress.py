"""Pydantic schemas for goal progress."""

from datetime import date

from pydantic import BaseModel


class GoalSupportingItem(BaseModel):
    id: str
    name: str
    type: str
    adherence_rate: float | None = None
    taken_count: int
    total_count: int


class GoalTrendPoint(BaseModel):
    date: str
    value: int


class GoalProgressItem(BaseModel):
    goal: str
    label: str
    icon: str
    item_count: int
    adherence_rate: float | None = None
    supporting_items: list[GoalSupportingItem]
    journal_metric: str | None = None
    journal_avg: float | None = None
    journal_trend: list[GoalTrendPoint] = []


class GoalProgressResponse(BaseModel):
    goals: list[GoalProgressItem]
    has_preferences: bool
    period_days: int | None = None
    start_date: date | None = None
    end_date: date | None = None
