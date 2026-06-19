# 🎯 ADVANCED FEATURES & BEST PRACTICES FOR EV GUARDIAN

## Part 1: ADVANCED ANALYTICS FEATURES

### Feature: Predictive Maintenance Scheduling

**What it does:** Automatically schedules maintenance before failures happen

**Implementation:**

```python
# backend/app/services/maintenance_service.py

class MaintenanceService:
    """Advanced maintenance scheduling based on predictions"""
    
    def calculate_optimal_maintenance_date(self, vehicle_id: str):
        """Schedule maintenance at best time"""
        
        # Get latest telemetry
        latest = db.query(Telemetry)\
            .filter_by(vehicle_id=vehicle_id)\
            .order_by(Telemetry.date.desc())\
            .first()
        
        # Get prediction
        prediction = ml_service.predict({
            'soc': latest.soc_pct,
            'soh': latest.soh_pct,
            'temp': latest.temperature_c,
            'voltage': latest.voltage_v,
            'current': latest.current_a,
            'cycle_count': latest.cycle,
            'cell_imbalance': latest.cell_imbalance,
            'thermal_event': latest.thermal_event,
            'fast_charge_event': latest.fast_charge_event,
        })
        
        rul_cycles = prediction['predicted_rul_cycles']
        
        # Calculate when battery will hit critical
        cycles_per_day = 5  # Average cycles per day
        days_until_critical = rul_cycles / cycles_per_day
        
        # Schedule 20% before critical
        recommended_date = datetime.now() + timedelta(
            days=days_until_critical * 0.8
        )
        
        return {
            'vehicle_id': vehicle_id,
            'current_rul': rul_cycles,
            'recommended_date': recommended_date,
            'urgency': 'High' if rul_cycles < 500 else 'Normal',
            'estimated_cost': self.estimate_replacement_cost(
                latest.model, latest.capacity_pct
            )
        }
    
    def estimate_replacement_cost(self, model: str, capacity_pct: float):
        """Estimate battery replacement cost"""
        
        # Cost models (in USD)
        base_costs = {
            'Tesla Model 3': 5500,
            'Nissan Leaf': 3500,
            'BMW i3': 6500,
            'VW ID.4': 5000,
        }
        
        base = base_costs.get(model, 5000)
        
        # Degraded battery = more expensive (more damage)
        if capacity_pct < 70:
            multiplier = 1.5
        elif capacity_pct < 80:
            multiplier = 1.2
        else:
            multiplier = 1.0
        
        return base * multiplier
```

**Usage:**
```bash
curl http://localhost:8000/api/maintenance/suggest-schedule/VEH-001

# Response:
{
  "vehicle_id": "VEH-001",
  "current_rul": 450,
  "recommended_date": "2026-07-10T00:00:00Z",
  "urgency": "High",
  "estimated_cost": 8250
}
```

---

### Feature: Regional Performance Analytics

```python
# backend/app/services/analytics_service.py

class AnalyticsService:
    """Advanced analytics for fleet optimization"""
    
    def get_regional_health_trends(self, days: int = 30):
        """Analyze health trends by region"""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        data = db.query(
            Vehicle.region,
            func.avg(Telemetry.capacity_pct).label('avg_capacity'),
            func.avg(Telemetry.temperature_c).label('avg_temp'),
            func.count(Alert.id).label('alert_count'),
            func.avg(Telemetry.rul_cycles).label('avg_rul'),
        )\
        .join(Telemetry, Vehicle.vehicle_id == Telemetry.vehicle_id)\
        .outerjoin(Alert, Vehicle.vehicle_id == Alert.vehicle_id)\
        .filter(Telemetry.date >= cutoff_date)\
        .group_by(Vehicle.region)\
        .all()
        
        return [
            {
                'region': row[0],
                'avg_capacity_pct': row[1],
                'avg_temperature_c': row[2],
                'alert_count': row[3],
                'avg_rul_cycles': row[4],
                'health_score': self.calculate_health_score(row[1], row[4]),
            }
            for row in data
        ]
    
    def calculate_health_score(self, capacity_pct: float, rul_cycles: float):
        """Calculate overall health score (0-100)"""
        
        # Capacity score (0-50 points)
        if capacity_pct >= 90:
            capacity_score = 50
        elif capacity_pct >= 80:
            capacity_score = 40
        elif capacity_pct >= 70:
            capacity_score = 30
        else:
            capacity_score = 20
        
        # RUL score (0-50 points)
        if rul_cycles >= 1000:
            rul_score = 50
        elif rul_cycles >= 500:
            rul_score = 35
        elif rul_cycles >= 200:
            rul_score = 20
        else:
            rul_score = 5
        
        return capacity_score + rul_score
    
    def get_fleet_efficiency_report(self):
        """Comprehensive fleet efficiency report"""
        
        all_vehicles = db.query(Vehicle).all()
        total_vehicles = len(all_vehicles)
        
        # Calculate various metrics
        total_capacity = sum([v.nominal_capacity_kwh for v in all_vehicles])
        avg_age_days = 0  # Calculate from telemetry
        
        return {
            'total_vehicles': total_vehicles,
            'total_capacity_kwh': total_capacity,
            'avg_vehicle_age_days': avg_age_days,
            'fleet_health_score': self.calculate_fleet_health_score(),
            'regional_breakdown': self.get_regional_health_trends(),
            'maintenance_forecast_90days': self.forecast_maintenance_needs(days=90),
            'projected_battery_costs': self.project_battery_replacement_costs(),
        }
    
    def forecast_maintenance_needs(self, days: int = 90):
        """Forecast maintenance needs for next N days"""
        
        future_date = datetime.now() + timedelta(days=days)
        
        # Predict which vehicles will need maintenance
        vehicles_needing_maintenance = []
        
        for vehicle in db.query(Vehicle).all():
            latest_telemetry = db.query(Telemetry)\
                .filter_by(vehicle_id=vehicle.vehicle_id)\
                .order_by(Telemetry.date.desc())\
                .first()
            
            prediction = ml_service.predict({...})
            rul = prediction['predicted_rul_cycles']
            
            # If RUL drops below threshold in next 90 days
            if rul < 600:
                vehicles_needing_maintenance.append({
                    'vehicle_id': vehicle.vehicle_id,
                    'current_rul': rul,
                    'days_until_maintenance': rul / 5,
                })
        
        return {
            'forecast_days': days,
            'estimated_vehicles_needing_maintenance': len(vehicles_needing_maintenance),
            'vehicles': vehicles_needing_maintenance,
        }
```

---

## Part 2: MACHINE LEARNING IMPROVEMENTS

### Feature: Custom ML Model Training

```python
# backend/app/ml/model_trainer.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

class ModelTrainer:
    """Train custom ML models on your fleet data"""
    
    def train_health_classifier(self, training_data_csv: str):
        """Train health classification model"""
        
        # Load data
        df = pd.read_csv(training_data_csv)
        
        # Features
        feature_cols = [
            'voltage_v', 'current_a', 'temperature_c',
            'internal_resistance_ohm', 'soc_pct', 'soh_pct',
            'depth_of_discharge_pct', 'cell_imbalance',
            'thermal_event', 'fast_charge_event', 'cycle_count'
        ]
        
        X = df[feature_cols]
        y = df['health_status']  # Target: Healthy/Moderate/Degraded/Critical
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Standardize features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            random_state=42
        )
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        accuracy = model.score(X_test_scaled, y_test)
        
        # Save model
        joblib.dump(model, 'models/health_classifier_v2.pkl')
        joblib.dump(scaler, 'models/scaler_v2.pkl')
        
        return {
            'model': 'health_classifier',
            'version': 'v2',
            'accuracy': accuracy,
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features': feature_cols,
        }
```

---

## Part 3: INTEGRATION WITH EXTERNAL SYSTEMS

### Feature: Tesla API Integration

```python
# backend/app/services/tesla_service.py

import requests
from datetime import datetime

class TeslaIntegration:
    """Fetch real battery data from Tesla vehicles"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://owner-api.teslamotors.com/api/1"
    
    def sync_vehicle_data(self, vehicle_vin: str):
        """Fetch latest data from Tesla"""
        
        # Get vehicle list
        response = requests.get(
            f"{self.base_url}/vehicles",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        vehicles = response.json()['response']
        
        # Find matching VIN
        tesla_vehicle = next(
            (v for v in vehicles if v['vin'] == vehicle_vin),
            None
        )
        
        if not tesla_vehicle:
            return {"error": "Vehicle not found"}
        
        vehicle_id = tesla_vehicle['id']
        
        # Get charge state
        charge_response = requests.get(
            f"{self.base_url}/vehicles/{vehicle_id}/data_request/charge_state",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        charge_state = charge_response.json()['response']
        
        # Get climate data
        climate_response = requests.get(
            f"{self.base_url}/vehicles/{vehicle_id}/data_request/climate_state",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        climate_state = climate_response.json()['response']
        
        # Create telemetry record
        telemetry = Telemetry(
            vehicle_id=vehicle_vin,
            date=datetime.now(),
            cycle=charge_state['charge_session_starting_range'],
            voltage_v=charge_state['charger_voltage'],
            current_a=charge_state['charger_actual_current'],
            temperature_c=climate_state['inside_temp'],
            soc_pct=charge_state['battery_level'],
            soh_pct=charge_state['battery_range'] / charge_state['max_range'] * 100,
            capacity_pct=charge_state['usable_battery_level'],
        )
        
        db.add(telemetry)
        db.commit()
        
        return {"status": "synced", "vehicle": vehicle_vin}
```

**Usage:**
```bash
# Setup Tesla OAuth token first
export TESLA_TOKEN="your_access_token"

# Sync vehicle data
curl -X POST http://localhost:8000/api/vehicles/sync-tesla/5TJTK5CC4J0123456
```

---

### Feature: Salesforce Integration

```python
# backend/app/services/salesforce_service.py

from simple_salesforce import Salesforce

class SalesforceIntegration:
    """Send maintenance alerts to Salesforce"""
    
    def __init__(self, username: str, password: str, security_token: str):
        self.sf = Salesforce(
            username=username,
            password=password,
            security_token=security_token
        )
    
    def create_maintenance_case(self, vehicle_id: str, alert: dict):
        """Create Salesforce case for maintenance"""
        
        vehicle = db.query(Vehicle).filter_by(vehicle_id=vehicle_id).first()
        latest_telemetry = db.query(Telemetry)\
            .filter_by(vehicle_id=vehicle_id)\
            .order_by(Telemetry.date.desc())\
            .first()
        
        case_data = {
            'Subject': f'Battery Maintenance - {vehicle_id}',
            'Description': f"""
            Vehicle: {vehicle.vehicle_id}
            Model: {vehicle.model}
            Region: {vehicle.region}
            
            Health Status: {latest_telemetry.health_status}
            Capacity: {latest_telemetry.capacity_pct}%
            RUL: {latest_telemetry.rul_cycles} cycles
            
            Alert: {alert['message']}
            Severity: {alert['severity']}
            """,
            'Priority': 'High' if alert['severity'] == 'Critical' else 'Medium',
            'Status': 'New',
        }
        
        # Create case in Salesforce
        result = self.sf.Case.create(case_data)
        
        return {
            'status': 'created',
            'salesforce_case_id': result['id'],
            'vehicle_id': vehicle_id,
        }
```

---

## Part 4: MONITORING & ALERTING

### Feature: Prometheus Metrics

```python
# backend/app/services/metrics_service.py

from prometheus_client import Counter, Gauge, Histogram

# Define metrics
vehicle_count = Gauge('ev_guardian_vehicles_total', 'Total vehicles')
alert_count = Counter('ev_guardian_alerts_total', 'Total alerts created')
prediction_latency = Histogram('ev_guardian_prediction_seconds', 'Prediction latency')
battery_health = Gauge('ev_guardian_battery_health', 'Battery health percentage', 
                       ['vehicle_id', 'region'])

def record_metrics():
    """Update metrics"""
    
    # Total vehicles
    total = db.query(Vehicle).count()
    vehicle_count.set(total)
    
    # Total alerts
    alerts = db.query(Alert).count()
    alert_count._value.set(alerts)
    
    # Battery health by vehicle
    for vehicle in db.query(Vehicle).all():
        latest = db.query(Telemetry)\
            .filter_by(vehicle_id=vehicle.vehicle_id)\
            .order_by(Telemetry.date.desc())\
            .first()
        
        if latest:
            battery_health.labels(
                vehicle_id=vehicle.vehicle_id,
                region=vehicle.region
            ).set(latest.capacity_pct)
```

---

## Part 5: SECURITY BEST PRACTICES

### Feature: API Authentication

```python
# backend/app/security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt

security = HTTPBearer()

def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token"""
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            "your-secret-key",
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Usage in endpoints
@router.get("/api/vehicles/")
async def list_vehicles(user_id: str = Depends(verify_token)):
    # Only authenticated users can access
    return db.query(Vehicle).all()
```

---

### Feature: Rate Limiting

```python
# backend/app/middleware.py

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Apply limits
@router.get("/api/vehicles/")
@limiter.limit("100/minute")
async def list_vehicles(request: Request):
    return db.query(Vehicle).all()
```

---

## Part 6: PERFORMANCE OPTIMIZATION

### Feature: Database Query Caching

```python
# backend/app/services/cache_service.py

from functools import lru_cache
from datetime import datetime, timedelta

class CacheService:
    """Cache frequent queries"""
    
    def __init__(self):
        self.cache = {}
        self.ttl = 300  # 5 minutes
    
    @lru_cache(maxsize=100)
    def get_fleet_summary(self):
        """Cache fleet summary for 5 minutes"""
        
        summary = {
            'total_vehicles': db.query(Vehicle).count(),
            'avg_capacity': db.query(func.avg(Telemetry.capacity_pct)).scalar(),
            # ... more metrics
        }
        
        return summary
    
    def invalidate_cache(self, key: str):
        """Clear cache on data change"""
        
        if key in self.cache:
            del self.cache[key]

cache_service = CacheService()
```

---

## Part 7: TESTING

### Unit Tests

```python
# backend/tests/test_ml_service.py

import pytest
from app.services.ml_service import ml_service

def test_health_prediction():
    """Test health classification"""
    
    payload = {
        'soc': 75,
        'soh': 80,
        'temp': 25,
        'voltage': 380,
        'current': 50,
        'cycle_count': 1500,
        'cell_imbalance': 0.05,
        'thermal_event': 0,
        'fast_charge_event': 0,
    }
    
    result = ml_service.predict(payload)
    
    assert 'health_status' in result
    assert result['health_status'] in ['Healthy', 'Moderate', 'Degraded', 'Critical']
    assert 'confidence' in result
    assert 0 <= result['confidence'] <= 1

def test_rul_prediction():
    """Test RUL prediction"""
    
    payload = {...}
    result = ml_service.predict(payload)
    
    assert 'predicted_rul_cycles' in result
    assert result['predicted_rul_cycles'] > 0
```

**Run tests:**
```bash
docker exec ev-fleet-intelligence-backend-1 pytest tests/
```

---

## Part 8: DOCUMENTATION

### Generate API Documentation

```bash
# Already available at:
http://localhost:8000/docs

# Also available in OpenAPI format:
http://localhost:8000/openapi.json
```

---

## Part 9: MAINTENANCE CHECKLIST

### Daily
- [ ] Check dashboard for new critical alerts
- [ ] Review health trends

### Weekly
- [ ] Backup database
- [ ] Review analytics reports
- [ ] Check system logs

### Monthly
- [ ] Clean up old data
- [ ] Retrain ML models (if needed)
- [ ] Security audit
- [ ] Performance review

---

## Part 10: RESOURCES & LEARNING

### Official Documentation
- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- scikit-learn: https://scikit-learn.org

### Tools
- Postman (API testing): https://postman.com
- Docker: https://docker.com
- GitHub: https://github.com

### Next Steps
1. Master the basic features
2. Add one advanced feature
3. Deploy to production
4. Integrate real IoT devices
5. Build mobile app

---

**Congratulations! You're now ready to build production-grade fleet intelligence systems! 🚀**
