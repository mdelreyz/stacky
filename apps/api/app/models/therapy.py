import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class TherapyCategory(str, enum.Enum):
    thermal = "thermal"
    light = "light"
    movement = "movement"
    breathwork = "breathwork"
    electrical = "electrical"
    manual = "manual"
    sound = "sound"
    skincare = "skincare"
    haircare = "haircare"
    recovery = "recovery"
    cognitive = "cognitive"
    other = "other"


class Therapy(Base):
    """Shared therapy catalog (cold plunge, sauna, red light, etc.)."""

    __tablename__ = "therapies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[TherapyCategory] = mapped_column(
        Enum(TherapyCategory, name="therapy_category_enum"),
        nullable=False,
        default=TherapyCategory.other,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    ai_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_profile_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ai_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
