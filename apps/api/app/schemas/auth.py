import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password_strength(v: str) -> str:
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one digit")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    return v


# ---------- Request schemas ----------


class SignupRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


# ---------- Response schemas ----------


class AuthUserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str

    model_config = {"from_attributes": True}


class SignupResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class MeResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}
