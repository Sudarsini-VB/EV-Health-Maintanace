from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import vehicles, telemetry, alerts, maintenance, predictions, fleet_analytics

# Create all tables on startup (idempotent — safe to call every run)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EV Guardian — Smart Fleet Intelligence Platform",
    description=(
        "AI-powered EV battery health monitoring, RUL prediction, and anomaly "
        "detection for a fleet of vehicles. Includes full CRUD for vehicles, "
        "telemetry, alerts, and maintenance scheduling."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router)
app.include_router(telemetry.router)
app.include_router(alerts.router)
app.include_router(maintenance.router)
app.include_router(predictions.router)
app.include_router(fleet_analytics.router)


@app.get("/")
def root():
    return {
        "message": "EV Guardian Fleet Intelligence API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
