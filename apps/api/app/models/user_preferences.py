import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base


class InteractionMode(str, enum.Enum):
    expert = "expert"
    advanced = "advanced"
    automated = "automated"
    guided = "guided"


class HealthGoal(str, enum.Enum):
    longevity = "longevity"
    cognitive = "cognitive"
    sleep = "sleep"
    stress = "stress"
    energy = "energy"
    immunity = "immunity"
    skin = "skin"
    hair = "hair"
    joint_health = "joint_health"
    gut_health = "gut_health"
    weight_management = "weight_management"
    muscle_recovery = "muscle_recovery"
    cardiovascular = "cardiovascular"
    hormonal_balance = "hormonal_balance"


class UserPreferences(Base):
    """User health preferences and constraints — drives AI recommendations and interaction mode."""

    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # Interaction mode
    interaction_mode: Mapped[InteractionMode] = mapped_column(
        Enum(InteractionMode, name="interaction_mode_enum"),
        nullable=False,
        default=InteractionMode.guided,
    )

    # Slot budgets
    max_supplements_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_tablets_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_medications: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Exercise capacity
    exercise_blocks_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    exercise_minutes_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Goals & concerns — stored as JSON arrays
    primary_goals: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    focus_concerns: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    excluded_ingredients: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Additional context
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    biological_sex: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="preferences")
