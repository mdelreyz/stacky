import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base
from app.models.user_supplement import Frequency, TakeWindow


class UserTherapy(Base):
    """A user's personalized settings for a therapy they practice."""

    __tablename__ = "user_therapies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    therapy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("therapies.id", ondelete="CASCADE"), nullable=False
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequency: Mapped[Frequency] = mapped_column(
        Enum(Frequency, name="frequency_enum", create_type=False), nullable=False, default=Frequency.daily
    )
    take_window: Mapped[TakeWindow] = mapped_column(
        Enum(TakeWindow, name="take_window_enum", create_type=False), nullable=False, default=TakeWindow.morning_fasted
    )
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    started_at: Mapped[date] = mapped_column(Date, nullable=False)
    ended_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="user_therapies")
    therapy = relationship("Therapy", lazy="selectin")
