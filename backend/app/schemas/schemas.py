from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ---------- Vehicle ----------
class VehicleBase(BaseModel):
    vehicle_id: str
    model: str
    region: str
    nominal_capacity_kwh: float
    owner_name: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    region: Optional[str] = None
    nominal_capacity_kwh: Optional[float] = None
    owner_name: Optional[str] = None


class VehicleResponse(VehicleBase):
    id: int
    registration_date: datetime

    class Config:
        from_attributes = True


# ---------- Telemetry ----------
class TelemetryBase(BaseModel):
    vehicle_id: str
    date: str
    cycle: int
    voltage_v: float
    current_a: float
    temperature_c: float
    internal_resistance_ohm: float
    soc_pct: float = Field(..., ge=0, le=100)
    depth_of_discharge_pct: float
    fast_charge_event: int = 0
    ambient_humidity_pct: float
    odometer_km: float
    capacity_pct: float


class TelemetryCreate(TelemetryBase):
    pass


class TelemetryUpdate(BaseModel):
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    temperature_c: Optional[float] = None
    internal_resistance_ohm: Optional[float] = None
    soc_pct: Optional[float] = None
    depth_of_discharge_pct: Optional[float] = None
    fast_charge_event: Optional[int] = None
    ambient_humidity_pct: Optional[float] = None
    odometer_km: Optional[float] = None
    capacity_pct: Optional[float] = None


class TelemetryResponse(TelemetryBase):
    id: int
    rul_cycles: Optional[float] = None
    health_status: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Predictions ----------
class PredictionRequest(BaseModel):
    voltage_v: float
    current_a: float
    temperature_c: float
    internal_resistance_ohm: float
    soc_pct: float
    depth_of_discharge_pct: float
    fast_charge_event: int
    ambient_humidity_pct: float
    cycle: int


class PredictionResponse(BaseModel):
    health_status: str
    health_confidence: float
    predicted_rul_cycles: float
    is_anomaly: bool
    anomaly_score: float
    recommendation: str


# ---------- Alerts ----------
class AlertBase(BaseModel):
    vehicle_id: str
    alert_type: str
    severity: str
    message: str


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    resolved: Optional[int] = None
    message: Optional[str] = None
    severity: Optional[str] = None


class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    resolved: int

    class Config:
        from_attributes = True


# ---------- Maintenance ----------
class MaintenanceBase(BaseModel):
    vehicle_id: str
    scheduled_date: datetime
    reason: str
    notes: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Fleet Analytics ----------
class FleetSummary(BaseModel):
    total_vehicles: int
    healthy_count: int
    moderate_count: int
    degraded_count: int
    critical_count: int
    avg_capacity_pct: float
    avg_rul_cycles: float
    open_alerts: int
    vehicles_due_maintenance: int
