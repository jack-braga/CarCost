import enum

from sqlalchemy import Column, ForeignKey, String, Integer, Numeric, Boolean, DateTime, Enum
from sqlalchemy.sql import func
import uuid
from app.db.base_class import Base

class FuelType(str, enum.Enum):
    petrol = "petrol"
    diesel = "diesel"
    electric = "electric"
    hybrid = "hybrid"


class Car(Base):
    __tablename__ = "cars"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String, nullable=True)
    license_plate = Column(String, nullable=True)
    fuel_type = Column(Enum(FuelType, name="fuel_type_enum"), nullable=False, default=FuelType.petrol)
    tank_capacity = Column(Numeric, nullable=True)
    is_default = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    