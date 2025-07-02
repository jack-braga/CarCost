from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class RegisterCredentials(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    password: str

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class UserSchema(BaseModel):
    id: str
    email: EmailStr
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
    phone: Optional[str] = None
    timezone: Optional[str] = None
    currency: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,  # allow population via aliases
    }

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema
