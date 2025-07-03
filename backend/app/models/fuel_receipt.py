from sqlalchemy import Column, ForeignKey, String, Numeric, DateTime, Date
from sqlalchemy.sql import func
import uuid
from app.db.base_class import Base

class FuelReceipt(Base):
    __tablename__ = "fuel_receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(Date, nullable=False)
    amount_paid = Column(Numeric, nullable=False)
    volume_purchased = Column(Numeric, nullable=False)
    advertised_price = Column(Numeric, nullable=False)
    odometer = Column(Numeric, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    car_id = Column(String, ForeignKey("cars.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
