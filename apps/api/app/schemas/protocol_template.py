import uuid
from datetime import datetime

from pydantic import BaseModel


class TemplateItemBlueprint(BaseModel):
    type: str  # supplement, medication, therapy, peptide
    catalog_name: str
    dosage: str | None = None
    take_window: str | None = None
    frequency: str | None = None
    notes: str | None = None


class ProtocolTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str
    difficulty: str | None
    icon: str | None
    is_featured: bool
    items: list[TemplateItemBlueprint] | None
    tags: list[str] | None
    adoption_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProtocolTemplateListItem(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str
    difficulty: str | None
    icon: str | None
    is_featured: bool
    items_count: int
    tags: list[str] | None
    adoption_count: int

    model_config = {"from_attributes": True}


class AdoptTemplateResponse(BaseModel):
    protocol_id: uuid.UUID
    protocol_name: str
    items_created: int
    items_existing: int
    message: str
