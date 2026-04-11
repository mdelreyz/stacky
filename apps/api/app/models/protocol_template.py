import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import UUID, Base


class TemplateCategory(str, enum.Enum):
    longevity = "longevity"
    sleep = "sleep"
    cognitive = "cognitive"
    energy = "energy"
    immune = "immune"
    recovery = "recovery"
    hormonal = "hormonal"
    skin = "skin"
    gut = "gut"
    cardiovascular = "cardiovascular"
    starter = "starter"


class ProtocolTemplate(Base):
    """System-provided protocol blueprints that users can browse and adopt."""

    __tablename__ = "protocol_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    difficulty: Mapped[str | None] = mapped_column(String(20), nullable=True)  # beginner, intermediate, advanced
    icon: Mapped[str | None] = mapped_column(String(30), nullable=True)  # FontAwesome icon name
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # JSON array of item blueprints:
    # [{"type": "supplement", "catalog_name": "Vitamin D3", "dosage": "5000 IU",
    #   "take_window": "morning_with_food", "frequency": "daily", "notes": "..."}]
    items: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)

    # Tags for filtering/search
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Adoption count — tracks popularity
    adoption_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
