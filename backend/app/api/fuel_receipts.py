from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File
from app.schemas import response_schemas, request_schemas
from app.api import deps
from app.models.car import Car
from app.models.fuel_receipt import FuelReceipt
from app.models.user import User
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import desc
import easyocr
import shutil
import os

router = APIRouter()
reader = easyocr.Reader(['en'])

def reconstruct_receipt_text(easyocr_results, y_tolerance=10):
    """
    Reconstructs receipt text preserving structure using bounding box coordinates.
    
    y_tolerance: Max vertical difference (pixels) considered for the same line.
    """
    
    # Extract coordinates and text from the full EasyOCR result
    data = []
    for (bbox, text, confidence) in easyocr_results:
        # Get the top-left corner (x1, y1)
        x1 = bbox[0][0]
        y1 = bbox[0][1]
        data.append({'x': x1, 'y': y1, 'text': text})
    
    # Sort all items primarily by Y, then by X
    data.sort(key=lambda item: (item['y'], item['x']))

    structured_text_lines = []
    current_line = []
    
    if not data:
        return ""

    # Start with the first item's Y-coordinate
    current_y = data[0]['y']

    for item in data:
        # Check if the item is on a new line (y-coordinate change > tolerance)
        if item['y'] > current_y + y_tolerance:
            # New line detected:
            # 1. Sort the previous line's elements by X
            current_line.sort(key=lambda x: x['x'])
            
            # 2. Join words with a single space and add the completed line
            line_text = " ".join([elem['text'] for elem in current_line])
            structured_text_lines.append(line_text)
            
            # 3. Start a new line
            current_line = []
            current_y = item['y']
            
        current_line.append(item)

    # Process the last line (if any)
    if current_line:
        current_line.sort(key=lambda x: x['x'])
        line_text = " ".join([elem['text'] for elem in current_line])
        structured_text_lines.append(line_text)

    # Join all lines with a newline character
    return "\n".join(structured_text_lines)

@router.post("/upload")
async def perform_ocr(file: UploadFile = File(...)):
    # 1. Save the uploaded file temporarily
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Run EasyOCR - 'result' now contains text AND coordinates
    result = reader.readtext(temp_path)
    os.remove(temp_path)

    # 3. Use the reconstruction function to format the text
    extracted_text_structured = reconstruct_receipt_text(result)
    
    # 4. Return the single, structured text string
    return {"text": extracted_text_structured}

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
def get_all_fuel_receipts(car_id: str | None = None, current_user: User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    query = db.query(FuelReceipt).filter(FuelReceipt.user_id == current_user.id)

    if car_id:
        query = query.filter(FuelReceipt.car_id == car_id)

    fuel_receipts_for_user = query.order_by(desc(FuelReceipt.date)).all()
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
