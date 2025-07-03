from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas import response_schemas, request_schemas
from app.api import deps
from app.models.car import Car
from app.models.fuel_receipt import FuelReceipt
from app.models.user import User
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import desc

router = APIRouter()

@router.post("", response_model=response_schemas.FuelReceiptSchema)
def add_fuel_receipt(new_fuel_receipt_details: request_schemas.CreateFuelReceipt, current_user: User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    new_fuel_receipt = FuelReceipt(
        date=new_fuel_receipt_details.date,
        amount_paid=new_fuel_receipt_details.amountPaid,
        volume_purchased=new_fuel_receipt_details.volumePurchased,
        advertised_price=new_fuel_receipt_details.advertisedPrice,
        odometer=new_fuel_receipt_details.odometer,
        user_id=current_user.id,
        car_id=new_fuel_receipt_details.carId
    )

    db.add(new_fuel_receipt)
    db.commit()
    db.refresh(new_fuel_receipt)

    fuel_receipt_model = response_schemas.FuelReceiptSchema.model_validate(new_fuel_receipt)

    return fuel_receipt_model

@router.get("", response_model=List[response_schemas.FuelReceiptSchema])
def get_all_fuel_receipts(current_user: User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    fuel_receipts_for_user = db.query(FuelReceipt).filter(FuelReceipt.user_id == current_user.id).order_by(desc(FuelReceipt.date)).all()
    return [response_schemas.FuelReceiptSchema.model_validate(fuel_receipt) for fuel_receipt in fuel_receipts_for_user]

@router.delete("/{fuel_receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fuel_receipt(fuel_receipt_id: str, current_user: User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    fuel_receipt_to_delete = db.query(FuelReceipt).filter(
        FuelReceipt.id == fuel_receipt_id,
        FuelReceipt.user_id == current_user.id
    ).first()

    if not fuel_receipt_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel Receipt not found or you don't have permission to delete it."
        )

    # TODO: delete assocaited objects like uploaded images

    db.delete(fuel_receipt_to_delete)
    db.commit()

    return

@router.put("/{fuel_receipt_id}", response_model=response_schemas.FuelReceiptSchema)
def update_fuel_receipt(new_fuel_receipt_details: request_schemas.UpdateFuelReceipt, fuel_receipt_id: str, current_user: User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    fuel_receipt_to_update = db.query(FuelReceipt).filter(
        FuelReceipt.id == fuel_receipt_id,
        FuelReceipt.user_id == current_user.id
    ).first()

    if not fuel_receipt_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel Receipt not found or you don't have permission to update it."
        )

    for field, value in new_fuel_receipt_details.model_dump(exclude_unset=True, by_alias=True).items():
        setattr(fuel_receipt_to_update, field, value)

    db.commit()
    db.refresh(fuel_receipt_to_update)

    fuel_receipt_model = response_schemas.FuelReceiptSchema.model_validate(fuel_receipt_to_update)

    return fuel_receipt_model
