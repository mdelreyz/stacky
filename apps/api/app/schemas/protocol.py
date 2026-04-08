import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.medication import UserMedicationResponse
from app.schemas.supplement import UserSupplementResponse
from app.schemas.therapy import UserTherapyResponse


class ProtocolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    user_supplement_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    user_medication_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    user_therapy_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)


class ProtocolUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None
    user_supplement_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)
    user_medication_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)
    user_therapy_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)


class ProtocolItemResponse(BaseModel):
    id: uuid.UUID
    item_type: str
    user_supplement: UserSupplementResponse | None
    user_medication: UserMedicationResponse | None
    user_therapy: UserTherapyResponse | None
    sort_order: int

    model_config = {"from_attributes": True}


class ProtocolResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
    items: list[ProtocolItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
