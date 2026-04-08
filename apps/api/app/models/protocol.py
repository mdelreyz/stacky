import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base


class Protocol(Base):
    """Named group of regimen items (e.g., 'Morning Stack', 'Hair Protocol')."""

    __tablename__ = "protocols"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    schedule_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    manual_is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    schedule_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    schedule_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    weeks_of_month: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="protocols")
    items = relationship("ProtocolItem", back_populates="protocol", lazy="selectin", order_by="ProtocolItem.sort_order")


class ProtocolItem(Base):
    """Links a protocol to a user_supplement, user_medication, or user_therapy."""

    __tablename__ = "protocol_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    protocol_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("protocols.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "supplement", "medication", or "therapy"
    user_supplement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(), ForeignKey("user_supplements.id", ondelete="CASCADE"), nullable=True
    )
    user_medication_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(), ForeignKey("user_medications.id", ondelete="CASCADE"), nullable=True
    )
    user_therapy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(), ForeignKey("user_therapies.id", ondelete="CASCADE"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    protocol = relationship("Protocol", back_populates="items")
    user_supplement = relationship("UserSupplement", lazy="selectin")
    user_medication = relationship("UserMedication", lazy="selectin")
    user_therapy = relationship("UserTherapy", lazy="selectin")
