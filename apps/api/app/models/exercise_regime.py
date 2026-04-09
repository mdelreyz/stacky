import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base
from app.models.enums import WeekDay


class ExerciseRegime(Base):
    """A named collection of routines on a weekly schedule (PPL, Upper/Lower, etc.)."""

    __tablename__ = "exercise_regimes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="exercise_regimes")
    schedule_entries = relationship(
        "ExerciseRegimeEntry",
        back_populates="regime",
        lazy="selectin",
        order_by="ExerciseRegimeEntry.day_of_week",
        cascade="all, delete-orphan",
    )


class ExerciseRegimeEntry(Base):
    """Maps a routine to a day of the week within a regime."""

    __tablename__ = "exercise_regime_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    regime_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("exercise_regimes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    routine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("workout_routines.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[WeekDay] = mapped_column(
        Enum(WeekDay, name="week_day_enum"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    regime = relationship("ExerciseRegime", back_populates="schedule_entries")
    routine = relationship("WorkoutRoutine", lazy="selectin")
