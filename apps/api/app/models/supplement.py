import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class SupplementCategory(str, enum.Enum):
    vitamin = "vitamin"
    mineral = "mineral"
    herb = "herb"
    amino_acid = "amino_acid"
    nootropic = "nootropic"
    hormone = "hormone"
    probiotic = "probiotic"
    enzyme = "enzyme"
    fatty_acid = "fatty_acid"
    antioxidant = "antioxidant"
    adaptogen = "adaptogen"
    peptide = "peptide"
    other = "other"


class Supplement(Base):
    """Shared supplement catalog. AI profile is generated once, reused by all users."""

    __tablename__ = "supplements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[SupplementCategory] = mapped_column(
        Enum(SupplementCategory, name="supplement_category_enum"),
        nullable=False,
        default=SupplementCategory.other,
    )
    form: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # AI-generated profile (see ai_onboarding service for schema)
    ai_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_profile_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ai_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
