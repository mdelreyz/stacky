import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class NutritionCycle(Base):
    """Nutrition cycling schedule (carb, protein, keto, calorie cycling)."""

    __tablename__ = "nutrition_cycles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cycle_type: Mapped[str] = mapped_column(String(50), nullable=False)  # carb_cycling, protein_cycling, etc.
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Array of {name, duration_days, macros: {carbs_g, protein_g, fat_g, calories_kcal}, notes}
    phases: Mapped[dict] = mapped_column(JSON, nullable=False)
    current_phase_idx: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    phase_started_at: Mapped[date] = mapped_column(Date, nullable=False)
    next_transition: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
