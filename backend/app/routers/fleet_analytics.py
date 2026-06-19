from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.models import db_models
from app.schemas import schemas

router = APIRouter(prefix="/api/fleet", tags=["Fleet Analytics"])


@router.get("/summary", response_model=schemas.FleetSummary)
def fleet_summary(db: Session = Depends(get_db)):
    total_vehicles = db.query(func.count(db_models.Vehicle.id)).scalar() or 0

    # Latest telemetry per vehicle (subquery on max id per vehicle_id)
    subq = (
        db.query(
            db_models.Telemetry.vehicle_id,
            func.max(db_models.Telemetry.id).label("max_id"),
        )
        .group_by(db_models.Telemetry.vehicle_id)
        .subquery()
    )
    latest_records = (
        db.query(db_models.Telemetry)
        .join(subq, db_models.Telemetry.id == subq.c.max_id)
        .all()
    )

    health_counts = {"Healthy": 0, "Moderate": 0, "Degraded": 0, "Critical": 0}
    capacities = []
    ruls = []
    for r in latest_records:
        if r.health_status in health_counts:
            health_counts[r.health_status] += 1
        capacities.append(r.capacity_pct)
        if r.rul_cycles is not None:
            ruls.append(r.rul_cycles)

    avg_capacity = round(sum(capacities) / len(capacities), 2) if capacities else 0.0
    avg_rul = round(sum(ruls) / len(ruls), 2) if ruls else 0.0

    open_alerts = db.query(func.count(db_models.Alert.id)).filter(
        db_models.Alert.resolved == 0
    ).scalar() or 0

    vehicles_due_maintenance = db.query(func.count(db_models.MaintenanceRecord.id)).filter(
        db_models.MaintenanceRecord.status == "Scheduled"
    ).scalar() or 0

    return schemas.FleetSummary(
        total_vehicles=total_vehicles,
        healthy_count=health_counts["Healthy"],
        moderate_count=health_counts["Moderate"],
        degraded_count=health_counts["Degraded"],
        critical_count=health_counts["Critical"],
        avg_capacity_pct=avg_capacity,
        avg_rul_cycles=avg_rul,
        open_alerts=open_alerts,
        vehicles_due_maintenance=vehicles_due_maintenance,
    )


@router.get("/latest-status")
def latest_status_per_vehicle(db: Session = Depends(get_db)):
    """Returns the latest telemetry snapshot for every vehicle, joined with vehicle info."""
    subq = (
        db.query(
            db_models.Telemetry.vehicle_id,
            func.max(db_models.Telemetry.id).label("max_id"),
        )
        .group_by(db_models.Telemetry.vehicle_id)
        .subquery()
    )
    latest = (
        db.query(db_models.Telemetry, db_models.Vehicle)
        .join(subq, db_models.Telemetry.id == subq.c.max_id)
        .join(db_models.Vehicle, db_models.Vehicle.vehicle_id == db_models.Telemetry.vehicle_id)
        .all()
    )

    results = []
    for telemetry, vehicle in latest:
        results.append({
            "vehicle_id": vehicle.vehicle_id,
            "model": vehicle.model,
            "region": vehicle.region,
            "capacity_pct": telemetry.capacity_pct,
            "health_status": telemetry.health_status,
            "rul_cycles": telemetry.rul_cycles,
            "temperature_c": telemetry.temperature_c,
            "internal_resistance_ohm": telemetry.internal_resistance_ohm,
            "cycle": telemetry.cycle,
            "odometer_km": telemetry.odometer_km,
        })
    return results


@router.get("/rankings")
def vehicle_rankings(db: Session = Depends(get_db), order: str = "worst"):
    """Ranks vehicles by battery health — worst-first (for maintenance prioritization) or best-first."""
    subq = (
        db.query(
            db_models.Telemetry.vehicle_id,
            func.max(db_models.Telemetry.id).label("max_id"),
        )
        .group_by(db_models.Telemetry.vehicle_id)
        .subquery()
    )
    query = (
        db.query(db_models.Telemetry, db_models.Vehicle)
        .join(subq, db_models.Telemetry.id == subq.c.max_id)
        .join(db_models.Vehicle, db_models.Vehicle.vehicle_id == db_models.Telemetry.vehicle_id)
    )
    if order == "worst":
        query = query.order_by(db_models.Telemetry.capacity_pct.asc())
    else:
        query = query.order_by(db_models.Telemetry.capacity_pct.desc())

    results = []
    for telemetry, vehicle in query.limit(20).all():
        results.append({
            "vehicle_id": vehicle.vehicle_id,
            "model": vehicle.model,
            "region": vehicle.region,
            "capacity_pct": telemetry.capacity_pct,
            "health_status": telemetry.health_status,
            "rul_cycles": telemetry.rul_cycles,
        })
    return results


@router.get("/region-comparison")
def region_comparison(db: Session = Depends(get_db)):
    """Average battery capacity grouped by region — useful for spotting climate-driven degradation."""
    subq = (
        db.query(
            db_models.Telemetry.vehicle_id,
            func.max(db_models.Telemetry.id).label("max_id"),
        )
        .group_by(db_models.Telemetry.vehicle_id)
        .subquery()
    )
    rows = (
        db.query(
            db_models.Vehicle.region,
            func.avg(db_models.Telemetry.capacity_pct).label("avg_capacity"),
            func.avg(db_models.Telemetry.temperature_c).label("avg_temp"),
            func.count(db_models.Vehicle.id).label("vehicle_count"),
        )
        .join(subq, db_models.Vehicle.vehicle_id == subq.c.vehicle_id)
        .join(db_models.Telemetry, db_models.Telemetry.id == subq.c.max_id)
        .group_by(db_models.Vehicle.region)
        .all()
    )
    return [
        {
            "region": r.region,
            "avg_capacity_pct": round(r.avg_capacity, 2),
            "avg_temperature_c": round(r.avg_temp, 2),
            "vehicle_count": r.vehicle_count,
        }
        for r in rows
    ]
