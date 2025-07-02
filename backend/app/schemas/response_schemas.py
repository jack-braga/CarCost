from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.models.cars import FuelType

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

class CarSchema(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    name: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    license_plate: Optional[str] = Field(None, alias="licensePlate")
    fuel_type: FuelType = Field(..., alias="fuelType")
    tank_capacity: Optional[int] = Field(None, alias="tankCapacity")
    is_default: bool = Field(None, alias="isDefault")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,  # allow population via aliases
    }
