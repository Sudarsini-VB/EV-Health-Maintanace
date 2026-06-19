from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app.models import db_models
from app.schemas import schemas

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


@router.post("/", response_model=schemas.MaintenanceResponse, status_code=201)
def create_maintenance(record: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    vehicle = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == record.vehicle_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db_record = db_models.MaintenanceRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/", response_model=List[schemas.MaintenanceResponse])
def list_maintenance(
    vehicle_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(db_models.MaintenanceRecord)
    if vehicle_id:
        query = query.filter(db_models.MaintenanceRecord.vehicle_id == vehicle_id)
    if status:
        query = query.filter(db_models.MaintenanceRecord.status == status)
    return query.order_by(desc(db_models.MaintenanceRecord.scheduled_date)).offset(skip).limit(limit).all()


@router.get("/{record_id}", response_model=schemas.MaintenanceResponse)
def get_maintenance(record_id: int, db: Session = Depends(get_db)):
    record = db.query(db_models.MaintenanceRecord).filter(
        db_models.MaintenanceRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return record


@router.put("/{record_id}", response_model=schemas.MaintenanceResponse)
def update_maintenance(record_id: int, update: schemas.MaintenanceUpdate, db: Session = Depends(get_db)):
    record = db.query(db_models.MaintenanceRecord).filter(
        db_models.MaintenanceRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_maintenance(record_id: int, db: Session = Depends(get_db)):
    record = db.query(db_models.MaintenanceRecord).filter(
        db_models.MaintenanceRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    db.delete(record)
    db.commit()
    return None
