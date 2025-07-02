from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.cars import FuelType

class RegisterCredentials(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    password: str

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class CreateCar(BaseModel):
    name: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    licensePlate: Optional[str] = None
    fuelType: FuelType
    tankCapacity: Optional[int] = None
    isDefault: Optional[bool] = None

class UpdateCar(BaseModel):
    name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    licensePlate: Optional[str] = Field(default=None, alias="license_plate")
    fuelType: Optional[FuelType] = Field(default=None, alias="fuel_type")
    tankCapacity: Optional[int] = Field(default=None, alias="tank_capacity")
    isDefault: Optional[bool] = Field(default=None, alias="is_default")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }
