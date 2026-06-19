from sqlalchemy.orm import Session
from app.models import db_models


def evaluate_and_create_alerts(db: Session, vehicle_id: str, prediction: dict):
    """Automatically creates alerts based on ML prediction output."""

    alerts_to_create = []

    if prediction["is_anomaly"]:
        alerts_to_create.append({
            "alert_type": "Anomaly Detected",
            "severity": "High",
            "message": f"Abnormal sensor pattern detected (anomaly score: {prediction['anomaly_score']}). "
                       f"Recommend diagnostic check.",
        })

    if prediction["health_status"] == "Critical":
        alerts_to_create.append({
            "alert_type": "Critical Battery Health",
            "severity": "Critical",
            "message": "Battery capacity has dropped to critical levels. Replacement recommended.",
        })
    elif prediction["health_status"] == "Degraded":
        alerts_to_create.append({
            "alert_type": "Degraded Battery Health",
            "severity": "Medium",
            "message": f"Battery degrading faster than expected. Estimated RUL: "
                       f"{prediction['predicted_rul_cycles']:.0f} cycles.",
        })

    if 0 < prediction["predicted_rul_cycles"] <= 20:
        alerts_to_create.append({
            "alert_type": "Low Remaining Useful Life",
            "severity": "High",
            "message": f"Only {prediction['predicted_rul_cycles']:.0f} cycles of useful life remaining. "
                       f"Schedule maintenance.",
        })

    for alert_data in alerts_to_create:
        db_alert = db_models.Alert(vehicle_id=vehicle_id, **alert_data)
        db.add(db_alert)

    if alerts_to_create:
        db.commit()
