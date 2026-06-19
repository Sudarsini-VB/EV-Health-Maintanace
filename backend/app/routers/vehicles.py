from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import db_models
from app.schemas import schemas

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


@router.post("/", response_model=schemas.VehicleResponse, status_code=201)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == vehicle.vehicle_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle ID already registered")

    db_vehicle = db_models.Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.get("/", response_model=List[schemas.VehicleResponse])
def list_vehicles(
    skip: int = 0,
    limit: int = 100,
    region: Optional[str] = None,
    model: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(db_models.Vehicle)
    if region:
        query = query.filter(db_models.Vehicle.region == region)
    if model:
        query = query.filter(db_models.Vehicle.model == model)
    return query.offset(skip).limit(limit).all()


@router.get("/{vehicle_id}", response_model=schemas.VehicleResponse)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == vehicle_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.put("/{vehicle_id}", response_model=schemas.VehicleResponse)
def update_vehicle(vehicle_id: str, update: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == vehicle_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == vehicle_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db.delete(vehicle)
    db.commit()
    return None
