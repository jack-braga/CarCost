from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import datetime
from app.models.car import FuelType

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
    tankCapacity: Optional[float] = None
    isDefault: Optional[bool] = None

class UpdateCar(BaseModel):
    name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    licensePlate: Optional[str] = Field(default=None, alias="license_plate")
    fuelType: Optional[FuelType] = Field(default=None, alias="fuel_type")
    tankCapacity: Optional[float] = Field(default=None, alias="tank_capacity")
    isDefault: Optional[bool] = Field(default=None, alias="is_default")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }

class CreateFuelReceipt(BaseModel):
    date: datetime.date
    amountPaid: float
    volumePurchased: float
    advertisedPrice: float
    odometer: float
    carId: str

class UpdateFuelReceipt(BaseModel):
    date: Optional[datetime.date] = None
    amountPaid: Optional[float] = Field(default=None, alias="amount_paid")
    volumePurchased: Optional[float] = Field(default=None, alias="volume_purchased")
    advertisedPrice: Optional[float] = Field(default=None, alias="advertised_price")
    odometer: Optional[float] = None
    carId: Optional[str] = Field(default=None, alias="car_id")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }
