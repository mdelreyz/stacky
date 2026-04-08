import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class CycleType(str, enum.Enum):
    on_off = "on_off"
    taper = "taper"
    ramp = "ramp"
    custom = "custom"


class CyclePhase(str, enum.Enum):
    on = "on"
    off = "off"
    taper_up = "taper_up"
    taper_down = "taper_down"


class CyclingSchedule(Base):
    """Cycling schedule attached to any user_supplement or user_therapy."""

    __tablename__ = "cycling_schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "supplement", "medication", "therapy", "nutrition"
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(), nullable=False)  # polymorphic FK
    cycle_type: Mapped[CycleType] = mapped_column(
        Enum(CycleType, name="cycle_type_enum"), nullable=False, default=CycleType.on_off
    )
    on_duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    off_duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    current_phase: Mapped[CyclePhase] = mapped_column(
        Enum(CyclePhase, name="cycle_phase_enum"), nullable=False, default=CyclePhase.on
    )
    phase_started_at: Mapped[date] = mapped_column(Date, nullable=False)
    next_transition: Mapped[date] = mapped_column(Date, nullable=False)
    taper_schedule: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
