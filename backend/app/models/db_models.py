from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, nullable=False)
    region = Column(String, nullable=False)
    nominal_capacity_kwh = Column(Float, nullable=False)
    owner_name = Column(String, nullable=True)
    registration_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    telemetry = relationship("Telemetry", back_populates="vehicle", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle", cascade="all, delete-orphan")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    date = Column(String, nullable=False)
    cycle = Column(Integer, nullable=False)
    voltage_v = Column(Float, nullable=False)
    current_a = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    internal_resistance_ohm = Column(Float, nullable=False)
    soc_pct = Column(Float, nullable=False)
    depth_of_discharge_pct = Column(Float, nullable=False)
    fast_charge_event = Column(Integer, default=0)
    ambient_humidity_pct = Column(Float, nullable=False)
    odometer_km = Column(Float, nullable=False)
    capacity_pct = Column(Float, nullable=False)
    rul_cycles = Column(Float, nullable=True)
    health_status = Column(String, nullable=True)

    vehicle = relationship("Vehicle", back_populates="telemetry")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    alert_type = Column(String, nullable=False)   # e.g. "Anomaly", "Critical Health", "Low RUL"
    severity = Column(String, nullable=False)     # "Low", "Medium", "High", "Critical"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved = Column(Integer, default=0)  # 0 = open, 1 = resolved

    vehicle = relationship("Vehicle", back_populates="alerts")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="Scheduled")  # Scheduled, Completed, Cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vehicle = relationship("Vehicle", back_populates="maintenance_records")
