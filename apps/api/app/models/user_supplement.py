import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base
from app.models.enums import Frequency, TakeWindow


class UserSupplement(Base):
    """A user's personalized settings for a supplement they're taking."""

    __tablename__ = "user_supplements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    supplement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("supplements.id", ondelete="CASCADE"), nullable=False
    )
    dosage_amount: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    dosage_unit: Mapped[str] = mapped_column(String(30), nullable=False)
    frequency: Mapped[Frequency] = mapped_column(
        Enum(Frequency, name="frequency_enum"), nullable=False, default=Frequency.daily
    )
    take_window: Mapped[TakeWindow] = mapped_column(
        Enum(TakeWindow, name="take_window_enum", validate_strings=True),
        nullable=False,
        default=TakeWindow.morning_with_food,
    )
    with_food: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_out_of_stock: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    started_at: Mapped[date] = mapped_column(Date, nullable=False)
    ended_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="user_supplements")
    supplement = relationship("Supplement", lazy="selectin")
