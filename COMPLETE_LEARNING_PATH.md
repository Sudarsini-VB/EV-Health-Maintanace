# 📚 Complete Learning Path & Master Guide

## Your EV Guardian Journey

You've been given a **fully working, production-ready fleet intelligence platform**. This guide shows you:
1. **How to use it** (basic operations)
2. **How to extend it** (adding new features)
3. **How to master it** (becoming an expert)

---

## 🎯 WEEK 1: GET COMFORTABLE

### Day 1: Understand the Project
- [ ] Read: `README_FOR_HR.txt` (2 min)
- [ ] Read: `PROJECT_SUMMARY.md` (5 min)
- [ ] Run: `docker compose up --build` (30 sec wait)
- [ ] Explore: Dashboard at http://localhost:5173 (5 min)
- [ ] Explore: API docs at http://localhost:8000/docs (5 min)

**Goal:** Get comfortable with what the system does

---

### Day 2: Explore the Dashboard

**Tasks:**
1. Go to Overview page
   - Understand KPI cards (60 vehicles, 83.45% capacity, 58 alerts)
   - Read the pie chart (health distribution)
   - Look at the table (worst-performing vehicles)

2. Go to Vehicles page
   - See all 60 vehicles listed
   - Click on a vehicle to see details
   - Notice: model, region, owner, capacity

3. Go to Alerts page
   - See 58 alerts with different severities
   - Notice alert messages are auto-generated
   - See alert timestamps

4. Go to Maintenance page
   - See 30 vehicles scheduled for maintenance
   - Notice maintenance reasons

**Goal:** Learn what data the system tracks

---

### Day 3: Test the API

**Using Swagger at http://localhost:8000/docs:**

1. Try `/api/fleet/summary`
   - Click "Try it out"
   - See JSON response with 60 vehicles

2. Try `/api/vehicles/`
   - List all vehicles
   - See vehicle structure

3. Try `/api/vehicles/VEH-001`
   - Get specific vehicle
   - See full details

4. Try `/api/fleet/rankings?order=worst`
   - See worst-performing vehicles
   - Notice RUL and health status

**Goal:** Understand the API structure

---

### Day 4: Read the Code

**Read these files (30 min each):**

1. `backend/app/main.py` (30 min)
   - Understand app structure
   - See how routers are registered
   - Understand middleware (CORS)

2. `backend/app/routers/fleet_analytics.py` (30 min)
   - See fleet summary endpoint
   - Understand how data is queried
   - Notice database joins

3. `frontend/src/App.jsx` (15 min)
   - Understand React structure
   - See routing (Overview, Vehicles, Alerts, etc.)
   - Notice component structure

**Goal:** Know how the code is organized

---

### Day 5: Make Your First Change

**Task: Add a new KPI card to the dashboard**

1. Open `frontend/src/pages/Overview.jsx`
2. Add new metric (e.g., "Critical Vehicles")
3. Find where it says:
   ```jsx
   <KpiCard label="Fleet Size" value={summary.total_vehicles} .../>
   <KpiCard label="Avg Capacity" value={summary.avg_capacity_pct.toFixed(1)} .../>
   ```
4. Add after these:
   ```jsx
   <KpiCard 
     label="Critical Vehicles" 
     value={summary.critical_count} 
     accent="var(--status-critical)"
   />
   ```
5. Rebuild:
   ```bash
   docker compose up --build
   ```
6. Check: http://localhost:5173

**Goal:** Successfully modify and rebuild

---

## 🚀 WEEK 2: ADD FEATURES

### Day 6: Add New API Endpoint

**Task: Create endpoint to get vehicle details with latest telemetry**

1. Open `backend/app/routers/vehicles.py`
2. Add new endpoint:

```python
@router.get("/api/vehicles/{vehicle_id}/full-status")
def get_vehicle_full_status(vehicle_id: str, db: Session = Depends(get_db)):
    """Get vehicle with latest telemetry and predictions"""
    
    vehicle = db.query(Vehicle).filter_by(vehicle_id=vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    latest_telemetry = db.query(Telemetry)\
        .filter_by(vehicle_id=vehicle_id)\
        .order_by(Telemetry.date.desc())\
        .first()
    
    latest_alerts = db.query(Alert)\
        .filter_by(vehicle_id=vehicle_id)\
        .filter_by(status="Open")\
        .all()
    
    return {
        "vehicle": vehicle,
        "latest_telemetry": latest_telemetry,
        "open_alerts": len(latest_alerts),
        "alerts": latest_alerts,
    }
```

3. Test it:
```bash
curl http://localhost:8000/api/vehicles/VEH-001/full-status
```

**Goal:** Successfully add a new endpoint

---

### Day 7: Add Email Notifications

**Task: Send email when critical alert is created**

1. Create `backend/app/services/email_service.py`:

```python
import smtplib
from email.mime.text import MIMEText
import os

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.from_email = os.getenv("FROM_EMAIL", "alerts@evguardian.com")
        self.from_password = os.getenv("FROM_PASSWORD", "")
    
    def send_alert_email(self, vehicle_id, severity, message, to_email):
        """Send alert email"""
        
        if not self.from_password:
            print(f"Email service not configured. Would send: {message}")
            return
        
        subject = f"EV Guardian Alert: {severity} - {vehicle_id}"
        body = f"""
        Vehicle: {vehicle_id}
        Severity: {severity}
        Message: {message}
        
        View dashboard: http://localhost:5173/alerts
        """
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = self.from_email
        msg['To'] = to_email
        
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.from_email, self.from_password)
                server.send_message(msg)
            print(f"Email sent to {to_email}")
        except Exception as e:
            print(f"Email send failed: {e}")

email_service = EmailService()
```

2. Use it in alerts router:

```python
# In backend/app/routers/alerts.py

from app.services.email_service import email_service

@router.post("/api/alerts/")
def create_alert(alert: AlertSchema, db: Session = Depends(get_db)):
    alert_record = Alert(**alert.dict())
    db.add(alert_record)
    db.commit()
    
    # Send email for critical alerts
    if alert.severity == "Critical":
        email_service.send_alert_email(
            alert.vehicle_id,
            alert.severity,
            alert.message,
            "fleet-manager@company.com"
        )
    
    return alert_record
```

**Goal:** Integrate external service (email)

---

### Day 8: Create Custom Dashboard Widget

**Task: Add "Fleet Health Status" widget**

1. Create `frontend/src/components/FleetHealthWidget.jsx`:

```jsx
import React, { useState, useEffect } from 'react';

export default function FleetHealthWidget() {
  const [summary, setSummary] = useState(null);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/fleet/summary')
      .then(r => r.json())
      .then(data => setSummary(data))
      .catch(err => console.error(err));
  }, []);
  
  if (!summary) return <div>Loading...</div>;
  
  // Calculate health percentage
  const healthyPercent = (summary.healthy_count / summary.total_vehicles) * 100;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #161B22 0%, #1C222B 100%)',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #2A323D',
    }}>
      <h3 style={{ color: '#F2A93B', margin: '0 0 16px 0' }}>FLEET HEALTH STATUS</h3>
      
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#3FC1C9',
        marginBottom: '8px',
      }}>
        {healthyPercent.toFixed(0)}%
      </div>
      
      <div style={{ color: '#677080', marginBottom: '16px' }}>
        of fleet is healthy
      </div>
      
      {/* Health bar */}
      <div style={{
        background: '#0C0F14',
        height: '8px',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #3FC1C9, #5B8FD6)',
          height: '100%',
          width: `${healthyPercent}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      
      {/* Details */}
      <div style={{ marginTop: '16px', fontSize: '12px', color: '#677080' }}>
        <div>🟢 {summary.healthy_count} Healthy</div>
        <div>🔵 {summary.moderate_count} Moderate</div>
        <div>🟡 {summary.degraded_count} Degraded</div>
        <div>🔴 {summary.critical_count} Critical</div>
      </div>
    </div>
  );
}
```

2. Import in Overview.jsx and use it

**Goal:** Create custom React component

---

### Day 9: Add Real-time Updates with WebSocket

**Task: Stream fleet data in real-time**

1. Create `backend/app/routers/websocket.py`:

```python
from fastapi import APIRouter, WebSocket
import asyncio
import json

router = APIRouter()
connected_clients = []

@router.websocket("/ws/fleet-updates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            # Get current fleet summary
            summary = db.query(Vehicle).count()
            
            # Send to client
            await websocket.send_json({
                "timestamp": datetime.now().isoformat(),
                "total_vehicles": summary,
                "message": "Fleet update"
            })
            
            await asyncio.sleep(5)  # Update every 5 seconds
    except Exception as e:
        connected_clients.remove(websocket)
```

2. Use in frontend:

```javascript
// frontend/src/hooks/useFleetUpdates.js

export function useFleetUpdates() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/fleet-updates');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setData(data);
    };
    
    return () => ws.close();
  }, []);
  
  return data;
}
```

**Goal:** Implement real-time communication

---

### Day 10: Add Data Export Feature

**Task: Export fleet data to CSV**

1. Add endpoint to `backend/app/routers/fleet_analytics.py`:

```python
from fastapi.responses import FileResponse
import csv
import io

@router.get("/api/fleet/export/csv")
def export_fleet_csv():
    """Export fleet data as CSV"""
    
    # Get all vehicles with latest telemetry
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Vehicle ID', 'Model', 'Region', 'Owner',
        'Capacity %', 'RUL Cycles', 'Health Status', 'Open Alerts'
    ])
    
    # Data
    for vehicle in db.query(Vehicle).all():
        latest = db.query(Telemetry)\
            .filter_by(vehicle_id=vehicle.vehicle_id)\
            .order_by(Telemetry.date.desc())\
            .first()
        
        alerts_count = db.query(Alert)\
            .filter_by(vehicle_id=vehicle.vehicle_id, status="Open")\
            .count()
        
        writer.writerow([
            vehicle.vehicle_id,
            vehicle.model,
            vehicle.region,
            vehicle.owner_name,
            latest.capacity_pct if latest else "N/A",
            latest.rul_cycles if latest else "N/A",
            latest.health_status if latest else "N/A",
            alerts_count,
        ])
    
    # Return as file
    return FileResponse(
        io.BytesIO(output.getvalue().encode()),
        filename="fleet_export.csv",
        media_type="text/csv",
    )
```

2. Test:
```bash
curl http://localhost:8000/api/fleet/export/csv > fleet.csv
```

**Goal:** Add data export functionality

---

## 🎓 WEEK 3: MASTER & DEPLOY

### Day 11: Performance Optimization

**Task: Add caching to slow queries**

```python
# backend/app/services/cache_service.py

from functools import lru_cache
from datetime import datetime, timedelta

class CacheService:
    def __init__(self):
        self.cache = {}
    
    def get_fleet_summary(self, use_cache=True):
        """Get fleet summary with caching"""
        
        cache_key = 'fleet_summary'
        
        if use_cache and cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            # Return if less than 5 minutes old
            if (datetime.now() - timestamp).seconds < 300:
                return cached_data
        
        # Fetch fresh data
        summary = {
            'total_vehicles': db.query(Vehicle).count(),
            'healthy': db.query(Telemetry).filter_by(...).count(),
            # ... more queries
        }
        
        # Cache it
        self.cache[cache_key] = (summary, datetime.now())
        
        return summary

cache_service = CacheService()
```

---

### Day 12: Security Hardening

**Task: Add authentication to API**

```python
# backend/app/security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
import os

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")

def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token"""
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401)

# Use in endpoints
@router.get("/api/vehicles/")
async def list_vehicles(user_id: str = Depends(verify_token)):
    # Only authenticated users
    return db.query(Vehicle).all()
```

---

### Day 13: Write Tests

**Task: Add unit tests**

```python
# backend/tests/test_api.py

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_fleet_summary():
    """Test fleet summary endpoint"""
    response = client.get("/api/fleet/summary")
    assert response.status_code == 200
    
    data = response.json()
    assert "total_vehicles" in data
    assert data["total_vehicles"] == 60
    assert "healthy_count" in data
    assert data["healthy_count"] == 10

def test_get_vehicle():
    """Test get specific vehicle"""
    response = client.get("/api/vehicles/VEH-001")
    assert response.status_code == 200
    
    data = response.json()
    assert data["vehicle_id"] == "VEH-001"
    assert "model" in data

def test_create_alert():
    """Test creating alert"""
    response = client.post(
        "/api/alerts/",
        json={
            "vehicle_id": "VEH-001",
            "severity": "Warning",
            "message": "Test alert",
            "status": "Open"
        }
    )
    assert response.status_code == 200
```

**Run tests:**
```bash
docker exec ev-fleet-intelligence-backend-1 pytest tests/ -v
```

---

### Day 14: Deploy to Cloud

**Choose one option:**

**Option A: Deploy to AWS**
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin 123.dkr.ecr.us-east-1.amazonaws.com
docker build -t evguardian .
docker tag evguardian:latest 123.dkr.ecr.us-east-1.amazonaws.com/evguardian:latest
docker push 123.dkr.ecr.us-east-1.amazonaws.com/evguardian:latest

# Deploy to ECS, Lambda, or Fargate
```

**Option B: Deploy to Heroku**
```bash
heroku create ev-guardian
git push heroku main
heroku logs --tail
```

**Option C: Deploy to DigitalOcean**
```bash
doctl compute droplet create ev-guardian --image docker-20-04 --size s-1vcpu-1gb
# Then SSH and run docker compose up
```

---

## 📚 Reference Materials

### Documentation Files in Project

| File | Purpose | Read Time |
|------|---------|-----------|
| `HOW_TO_USE_PROJECT.md` | Daily usage guide | 10 min |
| `ADVANCED_FEATURES.md` | Advanced features | 15 min |
| `DEMO_GUIDE.md` | Feature explanations | 12 min |
| `PROJECT_SUMMARY.md` | Architecture overview | 8 min |
| `QUICK_DEMO.md` | Command reference | 2 min |

### External Resources

- FastAPI docs: https://fastapi.tiangolo.com
- React docs: https://react.dev
- Docker docs: https://docker.com/resources
- SQLAlchemy ORM: https://docs.sqlalchemy.org
- scikit-learn: https://scikit-learn.org

---

## 🎯 Mastery Checklist

- [ ] Week 1: Understand the basic project
- [ ] Week 2: Add 5 new features
- [ ] Week 3: Deploy to production
- [ ] Write comprehensive tests
- [ ] Integrate external services
- [ ] Optimize performance
- [ ] Add security
- [ ] Create mobile app
- [ ] Train custom ML models
- [ ] Build admin dashboard

---

## 💪 You're Ready!

You have:
✅ A fully working fleet intelligence system  
✅ Complete documentation  
✅ Step-by-step learning path  
✅ 10+ feature ideas to implement  
✅ Everything needed to master this  

**Go build something amazing! 🚀**

---

## Quick Commands Cheat Sheet

```bash
# Start
docker compose up --build

# Logs
docker logs -f ev-fleet-intelligence-backend-1

# Test API
curl http://localhost:8000/api/fleet/summary

# Open dashboard
open http://localhost:5173

# Open API docs
open http://localhost:8000/docs

# Stop
docker compose down

# Reset everything
docker compose down -v && docker compose up --build
```

---

**Happy learning! 🎉**
