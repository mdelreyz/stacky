import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class MedicationCategory(str, enum.Enum):
    longevity = "longevity"
    metabolic = "metabolic"
    hormonal = "hormonal"
    cardiovascular = "cardiovascular"
    cognitive = "cognitive"
    dermatological = "dermatological"
    anti_inflammatory = "anti_inflammatory"
    antimicrobial = "antimicrobial"
    other = "other"


class Medication(Base):
    """Shared medication catalog, kept distinct from supplements."""

    __tablename__ = "medications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[MedicationCategory] = mapped_column(
        Enum(MedicationCategory, name="medication_category_enum"),
        nullable=False,
        default=MedicationCategory.other,
    )
    form: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_profile_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ai_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
