import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base


class NotificationPreferences(Base):
    """Per-user notification settings — controls push reminders for each take window."""

    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # Master toggle
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Per-window reminder times (minutes offset from window default)
    # JSON dict: { "morning_fasted": "06:30", "morning_with_food": "07:30", ... }
    window_times: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Which windows have reminders enabled
    # JSON list: ["morning_fasted", "morning_with_food", "midday", ...]
    enabled_windows: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Quiet hours
    quiet_start: Mapped[str | None] = mapped_column(String(5), nullable=True)  # "22:00"
    quiet_end: Mapped[str | None] = mapped_column(String(5), nullable=True)    # "07:00"

    # Advance notice (minutes before window time)
    advance_minutes: Mapped[int | None] = mapped_column(default=5)

    # Snooze duration (minutes)
    snooze_minutes: Mapped[int | None] = mapped_column(default=10)

    # Additional notification types
    streak_reminders: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    refill_reminders: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    interaction_alerts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="notification_preferences")


class PushToken(Base):
    """Expo push token for a user's device — one user can have multiple devices."""

    __tablename__ = "push_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Expo push token string (ExponentPushToken[...])
    token: Mapped[str] = mapped_column(String(255), nullable=False)

    # Device identifier for dedup
    device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Platform
    platform: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "ios", "android", "web"

    # Active flag — set false when token is invalidated
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="push_tokens")
