import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base
from app.models.enums import ExerciseCategory, ExerciseEquipment, MuscleGroup


class Exercise(Base):
    """Exercise catalog — seeded entries are shared (user_id=NULL), users can add custom ones."""

    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[ExerciseCategory] = mapped_column(
        Enum(ExerciseCategory, name="exercise_category_enum"),
        nullable=False,
        default=ExerciseCategory.compound,
    )
    primary_muscle: Mapped[MuscleGroup] = mapped_column(
        Enum(MuscleGroup, name="muscle_group_enum"),
        nullable=False,
        default=MuscleGroup.full_body,
    )
    secondary_muscles: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    equipment: Mapped[ExerciseEquipment] = mapped_column(
        Enum(ExerciseEquipment, name="exercise_equipment_enum"),
        nullable=False,
        default=ExerciseEquipment.none,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_compound: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="custom_exercises")
