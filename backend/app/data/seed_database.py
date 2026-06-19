"""
Seeds the SQLite database with vehicles + telemetry from the synthetic
fleet_battery_data.csv, running each record through the ML service so
health_status / rul_cycles are predicted (not just copied from the CSV's
ground-truth columns) — this mirrors how the system behaves in real use.
"""

import os
import sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import db_models
from app.services.ml_service import ml_service
from app.services.alert_service import evaluate_and_create_alerts

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "fleet_battery_data.csv")


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    df = pd.read_csv(CSV_PATH)

    # 1. Create vehicles (one row per unique vehicle_id)
    vehicle_info = df.drop_duplicates(subset="vehicle_id")[
        ["vehicle_id", "model", "region", "nominal_capacity_kwh"]
    ]
    owner_names = [
        "R. Karthik", "S. Priya", "M. Arun", "V. Lakshmi", "K. Suresh", "A. Divya",
    ]
    created = 0
    for i, (_, row) in enumerate(vehicle_info.iterrows()):
        existing = db.query(db_models.Vehicle).filter(
            db_models.Vehicle.vehicle_id == row["vehicle_id"]
        ).first()
        if existing:
            continue
        v = db_models.Vehicle(
            vehicle_id=row["vehicle_id"],
            model=row["model"],
            region=row["region"],
            nominal_capacity_kwh=row["nominal_capacity_kwh"],
            owner_name=owner_names[i % len(owner_names)],
        )
        db.add(v)
        created += 1
    db.commit()
    print(f"Seeded {created} vehicles.")

    # 2. Insert telemetry — sample every few cycles to keep seed time fast,
    #    but always include the LAST cycle per vehicle so dashboard "latest status" is meaningful.
    feature_cols = [
        "voltage_v", "current_a", "temperature_c", "internal_resistance_ohm",
        "soc_pct", "depth_of_discharge_pct", "fast_charge_event",
        "ambient_humidity_pct", "cycle",
    ]

    total_inserted = 0
    alert_count = 0
    for vehicle_id, group in df.groupby("vehicle_id"):
        group_sorted = group.sort_values("cycle")
        # Sample every 4th cycle + always keep the final cycle
        sampled = group_sorted.iloc[::4].copy()
        last_row = group_sorted.iloc[[-1]]
        sampled = pd.concat([sampled, last_row]).drop_duplicates(subset="cycle").sort_values("cycle")

        for _, row in sampled.iterrows():
            payload = {col: row[col] for col in feature_cols}
            prediction = ml_service.predict(payload)

            record = db_models.Telemetry(
                vehicle_id=row["vehicle_id"],
                date=row["date"],
                cycle=int(row["cycle"]),
                voltage_v=row["voltage_v"],
                current_a=row["current_a"],
                temperature_c=row["temperature_c"],
                internal_resistance_ohm=row["internal_resistance_ohm"],
                soc_pct=row["soc_pct"],
                depth_of_discharge_pct=row["depth_of_discharge_pct"],
                fast_charge_event=int(row["fast_charge_event"]),
                ambient_humidity_pct=row["ambient_humidity_pct"],
                odometer_km=row["odometer_km"],
                capacity_pct=row["capacity_pct"],
                rul_cycles=prediction["predicted_rul_cycles"],
                health_status=prediction["health_status"],
            )
            db.add(record)
            total_inserted += 1

            # Only create alerts for the LATEST cycle per vehicle to avoid alert spam during seeding
            if row["cycle"] == group_sorted.iloc[-1]["cycle"]:
                db.commit()  # commit telemetry first so alert FK is satisfied
                evaluate_and_create_alerts(db, row["vehicle_id"], prediction)
                alert_count += 1

    db.commit()
    print(f"Seeded {total_inserted} telemetry records.")
    print(f"Evaluated alerts for {alert_count} vehicles' latest readings.")

    # 3. Seed a few maintenance records for degraded/critical vehicles
    from datetime import datetime, timedelta, timezone
    degraded_vehicles = db.query(db_models.Telemetry).filter(
        db_models.Telemetry.health_status.in_(["Degraded", "Critical"])
    ).all()
    seen = set()
    maint_count = 0
    for t in degraded_vehicles:
        if t.vehicle_id in seen:
            continue
        seen.add(t.vehicle_id)
        record = db_models.MaintenanceRecord(
            vehicle_id=t.vehicle_id,
            scheduled_date=datetime.now(timezone.utc) + timedelta(days=7),
            reason=f"Battery health: {t.health_status} (capacity {t.capacity_pct:.1f}%)",
            status="Scheduled",
            notes="Auto-scheduled based on predicted battery health.",
        )
        db.add(record)
        maint_count += 1
    db.commit()
    print(f"Seeded {maint_count} maintenance records.")

    db.close()


if __name__ == "__main__":
    seed()
