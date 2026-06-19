# 🚀 EV Guardian - Complete Usage Guide & Feature Implementation

## Part 1: HOW TO USE THE PROJECT

### 1. Basic Usage - Dashboard Navigation

#### Opening the Dashboard
```bash
# Start everything
cd ev-fleet-intelligence
docker compose up --build

# Open browser:
http://localhost:5173
```

#### What Each Page Does:

**📊 Overview Page** (Homepage)
- Shows fleet summary (60 vehicles, capacity, alerts)
- Fleet health breakdown (pie chart)
- Vehicles needing attention (table)
- Regional analytics (bar chart)
- ML model performance metrics

**🚗 Vehicles Page**
- List all 60 vehicles
- Filter by region, health status
- View each vehicle's details
- Edit vehicle info
- Add new vehicle

**🚨 Alerts Page**
- View all 58 active alerts
- Filter by severity (Critical, Warning, Info)
- Mark alerts as resolved
- See alert history
- Acknowledge alerts

**🔧 Maintenance Page**
- Scheduled maintenance records
- 30 vehicles due for service
- Mark maintenance as completed
- Schedule new maintenance
- Historical records

**📈 Analytics Page**
- Regional performance comparison
- Temperature impact analysis
- Capacity trends
- Fleet age distribution
- Health distribution over time

**⚡ Predict Page**
- Enter vehicle sensor data
- Get real-time predictions
- Battery health classification
- RUL (Remaining Useful Life) forecast
- Anomaly detection results

---

## Part 2: API USAGE - How Developers Use This

### Access API Documentation
```
http://localhost:8000/docs
```

### Common API Calls

#### 1. Get Fleet Summary
```bash
curl http://localhost:8000/api/fleet/summary

# Response:
{
  "total_vehicles": 60,
  "healthy_count": 10,
  "moderate_count": 35,
  "degraded_count": 13,
  "critical_count": 2,
  "avg_capacity_pct": 83.45,
  "open_alerts": 58,
  "vehicles_due_maintenance": 30
}
```

#### 2. List All Vehicles
```bash
curl http://localhost:8000/api/vehicles/

# Shows: VEH-001, VEH-002, ... VEH-060
# Each with: model, region, capacity, owner
```

#### 3. Get Specific Vehicle
```bash
curl http://localhost:8000/api/vehicles/VEH-001

# Shows detailed info about that vehicle
```

#### 4. Get Vehicle Telemetry (Sensor Data)
```bash
curl "http://localhost:8000/api/telemetry/?vehicle_id=VEH-001&limit=10"

# Shows: voltage, current, temperature, SOC (State of Charge)
# Last 10 readings
```

#### 5. Get AI Predictions for a Vehicle
```bash
curl -X POST http://localhost:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "soc": 75,
    "soh": 80,
    "temp": 25,
    "voltage": 380,
    "current": 50,
    "cycle_count": 1500,
    "cell_imbalance": 0.05,
    "thermal_event": 0,
    "fast_charge_event": 0
  }'

# Response includes:
# - health_status: "Healthy" | "Moderate" | "Degraded" | "Critical"
# - predicted_rul_cycles: 2000
# - is_anomaly: false
# - anomaly_score: 0.05
# - recommendation: "Battery healthy..."
```

#### 6. Get All Alerts
```bash
curl http://localhost:8000/api/alerts/

# Shows: 58 active alerts with severity levels
```

#### 7. Create New Alert
```bash
curl -X POST http://localhost:8000/api/alerts/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "VEH-061",
    "severity": "Warning",
    "message": "Battery capacity below threshold",
    "status": "Open"
  }'
```

#### 8. Schedule Maintenance
```bash
curl -X POST http://localhost:8000/api/maintenance/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "VEH-015",
    "scheduled_date": "2026-06-24T10:00:00Z",
    "reason": "Battery replacement - critical health",
    "status": "Scheduled",
    "notes": "Replace battery cells, update BMS firmware"
  }'
```

---

## Part 3: REAL-WORLD SCENARIOS - How to Use This

### Scenario 1: Fleet Manager Checking Daily Status

**What they do:**
1. Login to dashboard (http://localhost:5173)
2. Check Overview page (60 vehicles, 58 alerts)
3. Click Alerts page
4. See which vehicles need attention TODAY
5. Schedule maintenance for critical vehicles
6. Check Analytics to see regional trends

**API equivalent for automation:**
```python
import requests

# Get all vehicles with critical health
response = requests.get('http://localhost:8000/api/fleet/rankings?order=worst')
critical_vehicles = response.json()[:5]  # Top 5 worst

for vehicle in critical_vehicles:
    print(f"{vehicle['vehicle_id']}: {vehicle['health_status']}")
    # Schedule maintenance automatically
```

---

### Scenario 2: Technician at Service Center

**What they do:**
1. Open Vehicles page
2. Search for vehicle by ID (VEH-015)
3. View maintenance history
4. See recommended repairs (from alerts)
5. Mark maintenance as completed
6. Update vehicle status

**API for field service app:**
```bash
# Technician scans QR code → Gets vehicle data
curl http://localhost:8000/api/vehicles/VEH-015

# Uploads new telemetry after service
curl -X POST http://localhost:8000/api/telemetry/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "VEH-015",
    "date": "2026-06-17T14:30:00Z",
    "cycle": 2500,
    "voltage_v": 395,
    "current_a": 30,
    "temperature_c": 22,
    ...
  }'
```

---

### Scenario 3: Data Analyst Creating Reports

**What they do:**
1. Open Analytics page
2. See region-wise performance
3. Download data for Excel analysis
4. Create custom reports

**API for BI/Analytics:**
```bash
# Get regional data
curl http://localhost:8000/api/fleet/region-comparison

# Get model metrics for reporting
curl http://localhost:8000/api/predict/model-metrics
```

---

### Scenario 4: Operations Director Planning Budget

**What they do:**
1. Check how many vehicles need replacement soon (RUL < 500 cycles)
2. Estimate replacement costs
3. Plan maintenance schedule
4. Review analytics for regional patterns

**SQL Query (if you have direct DB access):**
```sql
SELECT vehicle_id, model, region, rul_cycles, capacity_pct 
FROM telemetry 
WHERE rul_cycles < 500 
ORDER BY rul_cycles ASC;
```

---

## Part 4: EXTENDING WITH NEW FEATURES

### Feature 1: Add IoT Device Integration

**Goal:** Receive real sensor data from actual vehicles

**Steps:**

1. **Create IoT Ingestion Endpoint** (add to backend/app/routers/telemetry.py):
```python
@router.post("/api/telemetry/iot")
async def ingest_iot_data(data: dict):
    """Accept data from IoT devices (Raspberry Pi, Tesla API, etc.)"""
    
    # Parse incoming sensor data
    vehicle_id = data.get("vin")  # Vehicle ID from device
    readings = data.get("sensors")
    
    # Create telemetry record
    telemetry = Telemetry(
        vehicle_id=vehicle_id,
        date=datetime.now(),
        voltage_v=readings["voltage"],
        current_a=readings["current"],
        temperature_c=readings["temp"],
        ...
    )
    db.add(telemetry)
    db.commit()
    
    return {"status": "received", "id": telemetry.id}
```

2. **Test with Sample IoT Data:**
```bash
curl -X POST http://localhost:8000/api/telemetry/iot \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "VEH-001",
    "timestamp": "2026-06-17T15:30:00Z",
    "sensors": {
      "voltage": 385,
      "current": 45,
      "temp": 28,
      "soc": 65,
      "soh": 82
    }
  }'
```

---

### Feature 2: Add Email Alerts

**Goal:** Send emails when alerts are created

**Steps:**

1. **Install email library:**
```bash
docker exec ev-fleet-intelligence-backend-1 pip install python-dotenv smtplib
```

2. **Create email service** (backend/app/services/email_service.py):
```python
import smtplib
from email.mime.text import MIMEText

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        
    def send_alert_email(self, vehicle_id, severity, message):
        """Send email when alert is created"""
        
        subject = f"⚠️ EV Guardian Alert: {severity} - {vehicle_id}"
        body = f"""
        Vehicle: {vehicle_id}
        Severity: {severity}
        Message: {message}
        
        Action needed at: http://localhost:5173/alerts
        """
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = "alerts@evguardian.com"
        msg['To'] = "fleet-manager@company.com"
        
        # Send via SMTP
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)

# Usage
email_service = EmailService()
email_service.send_alert_email("VEH-015", "Critical", "Battery below 30%")
```

3. **Integrate into alert creation:**
```python
@router.post("/api/alerts/")
async def create_alert(alert: AlertSchema, db: Session = Depends(get_db)):
    # Create alert in database
    alert_record = Alert(**alert.dict())
    db.add(alert_record)
    db.commit()
    
    # Send email notification
    email_service.send_alert_email(
        alert.vehicle_id, 
        alert.severity, 
        alert.message
    )
    
    return alert_record
```

---

### Feature 3: Add Mobile App API

**Goal:** Support mobile app clients

**Steps:**

1. **Create mobile-specific endpoints:**
```python
@router.get("/api/mobile/vehicle/{vehicle_id}/status")
async def get_mobile_vehicle_status(vehicle_id: str):
    """Lightweight endpoint for mobile apps"""
    
    vehicle = db.query(Vehicle).filter_by(vehicle_id=vehicle_id).first()
    latest_telemetry = db.query(Telemetry)\
        .filter_by(vehicle_id=vehicle_id)\
        .order_by(Telemetry.date.desc())\
        .first()
    
    return {
        "vehicle_id": vehicle_id,
        "model": vehicle.model,
        "health": latest_telemetry.health_status,
        "capacity": latest_telemetry.capacity_pct,
        "rul": latest_telemetry.rul_cycles,
        "alerts_count": len(get_vehicle_alerts(vehicle_id))
    }
```

2. **Test with mobile request:**
```bash
curl http://localhost:8000/api/mobile/vehicle/VEH-001/status
```

---

### Feature 4: Add Dashboard Widgets

**Goal:** Custom widgets on frontend

**New file:** `frontend/src/components/CustomWidget.jsx`

```jsx
import React, { useState, useEffect } from 'react';

export default function FleetHealthWidget() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/fleet/summary')
      .then(r => r.json())
      .then(data => setData(data));
  }, []);
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <div style={{
      background: '#161B22',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #2A323D'
    }}>
      <h3 style={{ color: '#F2A93B' }}>FLEET HEALTH</h3>
      
      <div style={{ fontSize: '32px', color: '#3FC1C9', fontWeight: 'bold' }}>
        {data.healthy_count}/{data.total_vehicles}
      </div>
      
      <div style={{ color: '#677080', marginTop: '8px' }}>
        vehicles healthy
      </div>
      
      <div style={{ marginTop: '16px', fontSize: '13px' }}>
        <div>🔴 Critical: {data.critical_count}</div>
        <div>🟡 Degraded: {data.degraded_count}</div>
        <div>🔵 Moderate: {data.moderate_count}</div>
      </div>
    </div>
  );
}
```

---

### Feature 5: Add Real-time Updates (WebSocket)

**Goal:** Live updates without page refresh

**Backend (new file):** `backend/app/routers/websocket.py`

```python
from fastapi import WebSocket, APIRouter
import json
import asyncio

router = APIRouter()

# Store connected clients
connected_clients: list[WebSocket] = []

@router.websocket("/ws/fleet/updates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            # Send fleet summary every 5 seconds
            summary = get_fleet_summary()
            await websocket.send_json(summary)
            await asyncio.sleep(5)
    except:
        connected_clients.remove(websocket)

async def broadcast_alert(alert_data):
    """Send alert to all connected clients"""
    for client in connected_clients:
        try:
            await client.send_json({"type": "alert", "data": alert_data})
        except:
            connected_clients.remove(client)
```

**Frontend:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/fleet/updates');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateDashboard(data);  // Live update!
};
```

---

## Part 5: DEPLOYMENT OPTIONS

### Option 1: Deploy to AWS

```bash
# Build Docker image
docker build -t evguardian:latest backend/

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag evguardian:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/evguardian:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/evguardian:latest

# Deploy to ECS
aws ecs create-service --cluster ev-fleet --service-name ev-guardian --task-definition ev-guardian:1
```

### Option 2: Deploy to Kubernetes

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ev-guardian-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ev-guardian-backend
  template:
    metadata:
      labels:
        app: ev-guardian-backend
    spec:
      containers:
      - name: backend
        image: evguardian:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql://user:pass@postgres:5432/evguardian"
```

```bash
kubectl apply -f kubernetes/deployment.yaml
```

### Option 3: Deploy to Heroku

```bash
# Create Heroku app
heroku create ev-guardian

# Push code
git push heroku main

# View logs
heroku logs --tail
```

---

## Part 6: ADDING YOUR OWN DATA

### Load Your Real Fleet Data

**Create CSV file** (`backend/app/data/your_fleet.csv`):
```csv
vehicle_id,model,region,owner_name,nominal_capacity_kwh
VEH-TEST-001,Tesla Model 3,North,Your Company,75
VEH-TEST-002,Nissan Leaf,South,Your Company,40
```

**Load into database:**
```python
import pandas as pd
from app.database import SessionLocal
from app.models.db_models import Vehicle

df = pd.read_csv('your_fleet.csv')
db = SessionLocal()

for _, row in df.iterrows():
    vehicle = Vehicle(
        vehicle_id=row['vehicle_id'],
        model=row['model'],
        region=row['region'],
        owner_name=row['owner_name'],
        nominal_capacity_kwh=row['nominal_capacity_kwh']
    )
    db.add(vehicle)

db.commit()
print(f"Loaded {len(df)} vehicles")
```

---

## Part 7: MONITORING & MAINTENANCE

### Check System Health

```bash
# View all containers
docker ps

# Check backend logs
docker logs ev-fleet-intelligence-backend-1

# Check frontend logs
docker logs ev-fleet-intelligence-frontend-1

# View database file
ls -lh backend/app/app.db

# Check Docker resource usage
docker stats
```

### Backup Database

```bash
# Backup SQLite
cp backend/app/app.db backend/app/app.db.backup

# Or with timestamp
cp backend/app/app.db backend/app/app.db.$(date +%Y%m%d_%H%M%S).backup
```

### Clear Old Data

```sql
-- Delete telemetry older than 90 days
DELETE FROM telemetry 
WHERE date < datetime('now', '-90 days');

-- Delete resolved alerts older than 30 days
DELETE FROM alerts 
WHERE status = 'Resolved' 
AND created_at < datetime('now', '-30 days');
```

---

## Part 8: COMMON TASKS

### Task: Add New Vehicle

**Via Dashboard:**
1. Go to Vehicles page
2. Click "Add Vehicle"
3. Fill form (ID, model, region, capacity)
4. Click Save

**Via API:**
```bash
curl -X POST http://localhost:8000/api/vehicles/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "VEH-NEW-001",
    "model": "Tesla Model S",
    "region": "North",
    "nominal_capacity_kwh": 100,
    "owner_name": "John Doe"
  }'
```

---

### Task: Record Telemetry Reading

**Via API (from IoT device):**
```bash
curl -X POST http://localhost:8000/api/telemetry/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "VEH-001",
    "date": "2026-06-17T15:45:00Z",
    "cycle": 2250,
    "voltage_v": 385,
    "current_a": 35,
    "temperature_c": 24,
    "internal_resistance_ohm": 0.08,
    "soc_pct": 80,
    "depth_of_discharge_pct": 20,
    "fast_charge_event": 0,
    "ambient_humidity_pct": 45,
    "odometer_km": 15000,
    "capacity_pct": 88
  }'
```

---

### Task: Resolve Alert

**Via Dashboard:**
1. Go to Alerts page
2. Click alert
3. Mark as "Resolved"
4. Save

**Via API:**
```bash
curl -X PUT http://localhost:8000/api/alerts/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "Resolved"}'
```

---

## Part 9: TROUBLESHOOTING

### Problem: Dashboard shows "Loading..."

**Solution:**
```bash
# Check backend is running
docker logs ev-fleet-intelligence-backend-1

# Check API endpoint
curl http://localhost:8000/api/fleet/summary

# If no data, database might be empty
docker exec ev-fleet-intelligence-backend-1 python app/data/seed_database.py
```

### Problem: API returns 500 error

**Check logs:**
```bash
docker logs ev-fleet-intelligence-backend-1 | tail -50
```

**Common causes:**
- Database not initialized
- ML model incompatibility (already fixed)
- Missing environment variables

---

### Problem: Port 5173 already in use

**Solution:**
```bash
# Kill process on that port
lsof -ti :5173 | xargs kill -9

# Or use different port
docker compose up -e FRONTEND_PORT=5174
```

---

## Part 10: NEXT STEPS

### To Master This Project:

1. **Learn the Codebase** (1 day)
   - Read backend/app/main.py
   - Understand routers
   - Learn ML service

2. **Add a Feature** (1 day)
   - Pick one from Part 4
   - Implement it
   - Test it

3. **Connect Real Data** (1 day)
   - Load your own vehicles
   - Integrate IoT devices
   - Add real telemetry

4. **Deploy** (1 day)
   - Set up production database (PostgreSQL)
   - Deploy to cloud (AWS/Azure/Heroku)
   - Set up monitoring

5. **Extend** (ongoing)
   - Add mobile app
   - Add advanced analytics
   - Add predictive maintenance

---

## Quick Cheat Sheet

```bash
# Start
docker compose up --build

# Stop
docker compose down

# Reset (delete all data)
docker compose down -v && docker compose up --build

# View logs
docker logs -f ev-fleet-intelligence-backend-1

# Test API
curl http://localhost:8000/api/fleet/summary

# Open dashboard
open http://localhost:5173

# Open API docs
open http://localhost:8000/docs
```

---

**You now know everything about using and extending this project! 🚀**
