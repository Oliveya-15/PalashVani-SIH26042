"""
NEW FILE -- request/response schemas for the auth endpoints.

Kept in their own file (app/schemas/auth_schemas.py) rather than appended
to the existing app/schemas/schemas.py -- zero lines of your existing
schema file change.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

SelfRegisterableRole = Literal["teacher", "student"]


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: SelfRegisterableRole = "teacher"
    school_name: Optional[str] = Field(default="", max_length=200)
    district: Optional[str] = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    school_name: Optional[str] = Field(default=None, max_length=200)
    district: Optional[str] = Field(default=None, max_length=100)


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    school_name: str
    district: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
