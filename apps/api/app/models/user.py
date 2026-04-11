import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    location_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships (lazy-loaded; use selectinload() in queries when needed)
    user_supplements = relationship("UserSupplement", back_populates="user")
    user_medications = relationship("UserMedication", back_populates="user")
    user_therapies = relationship("UserTherapy", back_populates="user")
    user_peptides = relationship("UserPeptide", back_populates="user")
    nutrition_cycles = relationship("NutritionCycle", back_populates="user")
    protocols = relationship("Protocol", back_populates="user")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    custom_exercises = relationship("Exercise", back_populates="user")
    workout_routines = relationship("WorkoutRoutine", back_populates="user")
    exercise_regimes = relationship("ExerciseRegime", back_populates="user")
    workout_sessions = relationship("WorkoutSession", back_populates="user")
    gym_locations = relationship("GymLocation", back_populates="user")
    notification_preferences = relationship("NotificationPreferences", back_populates="user", uselist=False)
    push_tokens = relationship("PushToken", back_populates="user")
    health_journal_entries = relationship("HealthJournalEntry", back_populates="user")
