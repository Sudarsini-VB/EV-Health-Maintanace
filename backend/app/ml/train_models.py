"""
EV Fleet Battery Intelligence — Model Training
------------------------------------------------
Trains 3 models on the synthetic fleet dataset:

1. Health Classifier (RandomForestClassifier)
   -> Predicts: Healthy / Moderate / Degraded / Critical

2. RUL Regressor (XGBoost / GradientBoosting fallback)
   -> Predicts: Remaining Useful Life (cycles until 70% capacity / EOL)

3. Anomaly Detector (IsolationForest)
   -> Flags abnormal battery behavior (sudden resistance spikes,
      voltage sag, abnormal temperature vs capacity relationship)

All models + scaler are persisted with joblib for serving via FastAPI.
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score, classification_report

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "fleet_battery_data.csv")
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    "voltage_v", "current_a", "temperature_c", "internal_resistance_ohm",
    "soc_pct", "depth_of_discharge_pct", "fast_charge_event",
    "ambient_humidity_pct", "cycle",
]


def load_data():
    df = pd.read_csv(DATA_PATH)
    return df


def train_health_classifier(df: pd.DataFrame, scaler: StandardScaler):
    X = df[FEATURES]
    y = df["health_status"]

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_scaled = scaler.transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    clf = RandomForestClassifier(
        n_estimators=150, max_depth=10, random_state=42, class_weight="balanced"
    )
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"[Health Classifier] Accuracy: {acc:.4f}")
    print(classification_report(y_test, preds, target_names=le.classes_))

    joblib.dump(clf, os.path.join(MODEL_DIR, "health_classifier.pkl"))
    joblib.dump(le, os.path.join(MODEL_DIR, "health_label_encoder.pkl"))
    return acc


def train_rul_regressor(df: pd.DataFrame, scaler: StandardScaler):
    X = df[FEATURES]
    y = df["rul_cycles"]

    X_scaled = scaler.transform(X)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    reg = GradientBoostingRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.08, random_state=42
    )
    reg.fit(X_train, y_train)
    preds = reg.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"[RUL Regressor] MAE: {mae:.2f} cycles | R2: {r2:.4f}")

    joblib.dump(reg, os.path.join(MODEL_DIR, "rul_regressor.pkl"))
    return mae, r2


def train_anomaly_detector(df: pd.DataFrame, scaler: StandardScaler):
    X = df[FEATURES]
    X_scaled = scaler.transform(X)

    iso = IsolationForest(
        n_estimators=200, contamination=0.05, random_state=42
    )
    iso.fit(X_scaled)

    preds = iso.predict(X_scaled)
    anomaly_rate = (preds == -1).mean()
    print(f"[Anomaly Detector] Flagged {anomaly_rate*100:.2f}% of records as anomalous")

    joblib.dump(iso, os.path.join(MODEL_DIR, "anomaly_detector.pkl"))
    return anomaly_rate


def main():
    df = load_data()

    scaler = StandardScaler()
    scaler.fit(df[FEATURES])
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(FEATURES, os.path.join(MODEL_DIR, "feature_list.pkl"))

    acc = train_health_classifier(df, scaler)
    mae, r2 = train_rul_regressor(df, scaler)
    anomaly_rate = train_anomaly_detector(df, scaler)

    metrics = {
        "health_classifier_accuracy": round(float(acc), 4),
        "rul_regressor_mae": round(float(mae), 2),
        "rul_regressor_r2": round(float(r2), 4),
        "anomaly_detection_rate": round(float(anomaly_rate), 4),
    }
    joblib.dump(metrics, os.path.join(MODEL_DIR, "metrics.pkl"))
    print("\nAll models trained and saved to:", MODEL_DIR)
    print("Metrics:", metrics)


if __name__ == "__main__":
    main()
