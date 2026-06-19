from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app.models import db_models
from app.schemas import schemas

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.post("/", response_model=schemas.AlertResponse, status_code=201)
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(get_db)):
    vehicle = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == alert.vehicle_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db_alert = db_models.Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.get("/", response_model=List[schemas.AlertResponse])
def list_alerts(
    vehicle_id: Optional[str] = None,
    resolved: Optional[int] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(db_models.Alert)
    if vehicle_id:
        query = query.filter(db_models.Alert.vehicle_id == vehicle_id)
    if resolved is not None:
        query = query.filter(db_models.Alert.resolved == resolved)
    if severity:
        query = query.filter(db_models.Alert.severity == severity)
    return query.order_by(desc(db_models.Alert.created_at)).offset(skip).limit(limit).all()


@router.get("/{alert_id}", response_model=schemas.AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}", response_model=schemas.AlertResponse)
def update_alert(alert_id: int, update: schemas.AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(alert, key, value)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return None
