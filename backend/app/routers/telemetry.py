from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app.models import db_models
from app.schemas import schemas
from app.services.ml_service import ml_service
from app.services.alert_service import evaluate_and_create_alerts

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])


@router.post("/", response_model=schemas.TelemetryResponse, status_code=201)
def create_telemetry(record: schemas.TelemetryCreate, db: Session = Depends(get_db)):
    vehicle = db.query(db_models.Vehicle).filter(
        db_models.Vehicle.vehicle_id == record.vehicle_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not registered. Create the vehicle first.")

    # Run ML prediction on the incoming reading
    prediction = ml_service.predict(record.model_dump())

    db_record = db_models.Telemetry(
        **record.model_dump(),
        rul_cycles=prediction["predicted_rul_cycles"],
        health_status=prediction["health_status"],
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # Auto-generate alerts if anomaly / critical health / low RUL
    evaluate_and_create_alerts(db, record.vehicle_id, prediction)

    return db_record


@router.get("/", response_model=List[schemas.TelemetryResponse])
def list_telemetry(
    vehicle_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    query = db.query(db_models.Telemetry)
    if vehicle_id:
        query = query.filter(db_models.Telemetry.vehicle_id == vehicle_id)
    return query.order_by(desc(db_models.Telemetry.id)).offset(skip).limit(limit).all()


@router.get("/{record_id}", response_model=schemas.TelemetryResponse)
def get_telemetry(record_id: int, db: Session = Depends(get_db)):
    record = db.query(db_models.Telemetry).filter(db_models.Telemetry.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Telemetry record not found")
    return record


@router.put("/{record_id}", response_model=schemas.TelemetryResponse)
def update_telemetry(record_id: int, update: schemas.TelemetryUpdate, db: Session = Depends(get_db)):
    record = db.query(db_models.Telemetry).filter(db_models.Telemetry.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Telemetry record not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    # Re-run prediction if key sensor fields changed
    payload = {
        "voltage_v": record.voltage_v,
        "current_a": record.current_a,
        "temperature_c": record.temperature_c,
        "internal_resistance_ohm": record.internal_resistance_ohm,
        "soc_pct": record.soc_pct,
        "depth_of_discharge_pct": record.depth_of_discharge_pct,
        "fast_charge_event": record.fast_charge_event,
        "ambient_humidity_pct": record.ambient_humidity_pct,
        "cycle": record.cycle,
    }
    prediction = ml_service.predict(payload)
    record.rul_cycles = prediction["predicted_rul_cycles"]
    record.health_status = prediction["health_status"]

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_telemetry(record_id: int, db: Session = Depends(get_db)):
    record = db.query(db_models.Telemetry).filter(db_models.Telemetry.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Telemetry record not found")
    db.delete(record)
    db.commit()
    return None
