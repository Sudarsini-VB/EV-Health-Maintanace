# EV Guardian — Smart EV Fleet Intelligence Platform

AI-powered battery health monitoring, remaining useful life (RUL) prediction, and anomaly detection across a fleet of electric vehicles. Built as a full-stack ML application: FastAPI backend with complete CRUD, three trained scikit-learn models, a SQLite database, and a React dashboard.

## What this project demonstrates

Rather than monitoring a single EV's battery (a "classroom" demo), this platform monitors an entire fleet — the same problem automotive companies, fleet operators, and EV OEMs actually pay engineers to solve: which vehicles need service, how much life is left in each pack, which batteries are behaving abnormally, and how climate/usage patterns affect degradation across regions.

### Core capabilities

- **Battery health classification** — RandomForestClassifier predicts Healthy / Moderate / Degraded / Critical from BMS-style sensor readings (96.3% test accuracy).
- **Remaining Useful Life (RUL) regression** — GradientBoostingRegressor estimates cycles remaining until end-of-life threshold (MAE 2.84 cycles, R² 0.944).
- **Anomaly detection** — IsolationForest flags sensor readings that deviate from learned normal battery behavior (e.g. cell imbalance, sensor faults).
- **Automatic alerting** — every telemetry insert is scored by all three models; critical health, degrading trends, or anomalies auto-generate alerts.
- **Auto-suggested maintenance** — degraded/critical vehicles get maintenance records seeded automatically.
- **Full CRUD** on vehicles, telemetry, alerts, and maintenance records via a REST API (16 endpoints).
- **Fleet analytics** — health distribution, worst/best ranked vehicles, region-vs-temperature climate correlation.
- **Live prediction console** — a "what-if" simulator in the dashboard that calls the model directly with slider-adjustable sensor inputs.

## Why this matters for interviews

The honest answer to "how does the software know the battery's state?" is: **it doesn't, by itself.** A real EV's Battery Management System (BMS) measures voltage, current, temperature, and cell-level data continuously, and that telemetry is what feeds a system like this. This project assumes that data pipeline exists (as it does in production EVs) and focuses on the part a software/ML engineer actually owns: turning raw BMS telemetry into health predictions, RUL estimates, anomaly flags, and actionable maintenance recommendations — at fleet scale.

The dataset here is synthetic but physics-informed: capacity fade follows a degradation curve influenced by temperature stress, fast-charging frequency, and depth-of-discharge, mirroring patterns documented in public battery aging research (e.g. NASA's Li-ion battery aging dataset). This is `Option 1`/`Option 2` from the public-dataset-or-simulator approach — no hardware required, fully defensible in an interview.

## Architecture

```
React Dashboard (Vite)
        │  REST calls
        ▼
FastAPI Backend  ──────────────►  ML Service (scikit-learn models)
        │                              │
        ▼                              ▼
SQLite Database              health_classifier.pkl
(vehicles, telemetry,        rul_regressor.pkl
 alerts, maintenance)        anomaly_detector.pkl
```

Every telemetry POST runs through all three models synchronously, persists the prediction alongside the raw reading, and evaluates alert/maintenance rules — so the database always reflects the model's current assessment, not just raw sensor data.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic
- **ML:** scikit-learn (RandomForestClassifier, GradientBoostingRegressor, IsolationForest), pandas, numpy, joblib
- **Frontend:** React 18, Vite, React Router, Recharts, lucide-react
- **Data:** synthetic fleet dataset (60 vehicles × 120 cycles), generated with degradation physics modeled on public Li-ion aging research

## Project structure

```
ev-fleet-intelligence/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint
│   │   ├── database.py              # SQLAlchemy engine/session
│   │   ├── models/db_models.py      # ORM models (Vehicle, Telemetry, Alert, MaintenanceRecord)
│   │   ├── schemas/schemas.py       # Pydantic request/response schemas
│   │   ├── routers/                 # CRUD endpoints per resource
│   │   ├── services/
│   │   │   ├── ml_service.py        # Loads models, runs predictions
│   │   │   └── alert_service.py     # Auto-alert generation rules
│   │   ├── ml/
│   │   │   ├── train_models.py      # Trains and saves all 3 models
│   │   │   └── saved_models/        # Persisted .pkl files
│   │   └── data/
│   │       ├── generate_fleet_data.py   # Synthetic dataset generator
│   │       ├── seed_database.py         # Loads CSV into SQLite via ML pipeline
│   │       └── fleet_battery_data.csv
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # CellGauge (signature battery-ring gauge), StatusBadge, Panel, KpiCard, Sidebar
    │   ├── pages/          # Overview, Vehicles, Alerts, Maintenance, Analytics, Predict
    │   ├── services/api.js # Centralized fetch wrapper for all endpoints
    │   └── tokens.css      # Design tokens (color/type/spacing)
    └── package.json
```

## Running it locally

### Backend

```bash
cd backend
pip install -r requirements.txt

# 1. Generate the synthetic fleet dataset
python app/data/generate_fleet_data.py

# 2. Train the ML models
python app/ml/train_models.py

# 3. Seed the database
python app/data/seed_database.py

# 4. Start the API server
python -m uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs` (FastAPI auto-generated Swagger UI).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`.

By default the frontend calls the API at `http://localhost:8000`. To point it elsewhere, set `VITE_API_URL` in a `.env` file in `frontend/`.

## API endpoints

| Resource | Endpoints |
|---|---|
| Vehicles | `POST/GET /api/vehicles/`, `GET/PUT/DELETE /api/vehicles/{id}` |
| Telemetry | `POST/GET /api/telemetry/`, `GET/PUT/DELETE /api/telemetry/{id}` (auto-predicts on POST) |
| Alerts | `POST/GET /api/alerts/`, `GET/PUT/DELETE /api/alerts/{id}` |
| Maintenance | `POST/GET /api/maintenance/`, `GET/PUT/DELETE /api/maintenance/{id}` |
| Predictions | `POST /api/predict/`, `GET /api/predict/model-metrics` |
| Fleet analytics | `GET /api/fleet/summary`, `/latest-status`, `/rankings`, `/region-comparison` |

##Dashboards

EV Fleet health gaurdian

@ EV Guardian Dashboard.html
@ 
