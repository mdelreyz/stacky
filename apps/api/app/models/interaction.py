import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import UUID, Base


class InteractionType(str, enum.Enum):
    contraindication = "contraindication"
    caution = "caution"
    synergy = "synergy"
    neutral = "neutral"


class Severity(str, enum.Enum):
    critical = "critical"
    major = "major"
    moderate = "moderate"
    minor = "minor"


class Interaction(Base):
    """Pre-computed interaction between two supplements."""

    __tablename__ = "interactions"
    __table_args__ = (
        UniqueConstraint("supplement_a_id", "supplement_b_id", name="uq_interaction_pair"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    supplement_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("supplements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    supplement_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("supplements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interaction_type: Mapped[InteractionType] = mapped_column(
        Enum(InteractionType, name="interaction_type_enum"), nullable=False
    )
    severity: Mapped[Severity] = mapped_column(Enum(Severity, name="severity_enum"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    mechanism: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="ai_generated")
    ai_confidence: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    supplement_a = relationship("Supplement", foreign_keys=[supplement_a_id], lazy="selectin")
    supplement_b = relationship("Supplement", foreign_keys=[supplement_b_id], lazy="selectin")
