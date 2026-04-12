import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class NotificationDelivery(Base):
    """Delivery log used to dedupe automated reminder sends."""

    __tablename__ = "notification_deliveries"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "notification_type",
            "target_date",
            "window",
            name="uq_notification_deliveries_user_type_date_window",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False, default="scheduled_reminder")
    target_date: Mapped[date] = mapped_column(Date(), nullable=False)
    window: Mapped[str] = mapped_column(String(32), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
