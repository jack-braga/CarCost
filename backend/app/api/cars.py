from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas import response_schemas, request_schemas
from app.api import deps
from app.models import user, cars
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import desc

router = APIRouter()

@router.post("", response_model=response_schemas.CarSchema)
def add_car(new_car_details: request_schemas.CreateCar, current_user: user.User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    new_car = cars.Car(
        user_id=current_user.id,
        name=new_car_details.name,
        make=new_car_details.make,
        model=new_car_details.model,
        year=new_car_details.year,
        color=new_car_details.color,
        license_plate=new_car_details.licensePlate,
        fuel_type=new_car_details.fuelType,
        tank_capacity=new_car_details.tankCapacity,
        is_default=new_car_details.isDefault
    )

    if (new_car_details.isDefault):
        db.query(cars.Car).filter(cars.Car.user_id == current_user.id, cars.Car.is_default == True).update({"is_default": False})


    db.add(new_car)
    db.commit()
    db.refresh(new_car)

    car_model = response_schemas.CarSchema.model_validate(new_car)

    return car_model

@router.get("", response_model=List[response_schemas.CarSchema])
def get_all_cars(current_user: user.User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    cars_for_user = db.query(cars.Car).filter(cars.Car.user_id == current_user.id).order_by(desc(cars.Car.is_default), desc(cars.Car.updated_at)).all()
    return [response_schemas.CarSchema.model_validate(car) for car in cars_for_user]

@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(car_id: str, current_user: user.User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    # TODO: Delete all assocaited objects (delete recieipts)
    car_to_delete = db.query(cars.Car).filter(
        cars.Car.id == car_id,
        cars.Car.user_id == current_user.id
    ).first()

    if not car_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found or you don't have permission to delete it."
        )

    db.delete(car_to_delete)
    db.commit()

    return

@router.post("/{car_id}/set-default", response_model=response_schemas.CarSchema)
def set_car_as_default(car_id: str, current_user: user.User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    db.query(cars.Car).filter(cars.Car.user_id == current_user.id, cars.Car.is_default == True).update({"is_default": False})

    car_to_set_as_default = db.query(cars.Car).filter(
        cars.Car.id == car_id,
        cars.Car.user_id == current_user.id
    ).first()

    if not car_to_set_as_default:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found or you don't have permission to set it as default."
        )
    
    car_to_set_as_default.is_default = True

    db.commit()
    db.refresh(car_to_set_as_default)

    car_model = response_schemas.CarSchema.model_validate(car_to_set_as_default)

    return car_model

@router.put("/{car_id}", response_model=response_schemas.CarSchema)
def update_car(new_car_details: request_schemas.UpdateCar, car_id: str, current_user: user.User = Depends(deps.get_current_user), db: Session = Depends(deps.get_db)):
    car_to_update = db.query(cars.Car).filter(
        cars.Car.id == car_id,
        cars.Car.user_id == current_user.id
    ).first()

    if not car_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found or you don't have permission to update it."
        )

    for field, value in new_car_details.model_dump(exclude_unset=True, by_alias=True).items():
        setattr(car_to_update, field, value)

    db.commit()
    db.refresh(car_to_update)

    car_model = response_schemas.CarSchema.model_validate(car_to_update)

    return car_model