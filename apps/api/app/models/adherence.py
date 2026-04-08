import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class AdherenceLog(Base):
    """Tracks whether a user took/skipped/completed a scheduled regimen item."""

    __tablename__ = "adherence_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "supplement", "medication", or "therapy"
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(), nullable=False)
    item_name_snapshot: Mapped[str | None] = mapped_column(String(255), nullable=True)
    take_window_snapshot: Mapped[str | None] = mapped_column(String(40), nullable=True)
    regimes_snapshot: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    taken_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    skip_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
