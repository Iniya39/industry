# FastAPI Backend for Industrial AI Predictive Maintenance
# REST API server for data ingestion, processing, and real-time communication

from fastapi import FastAPI, HTTPException, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import asyncio
import uvicorn
from influxdb_client import InfluxDBClient
import os
from dotenv import load_dotenv
load_dotenv()

print(os.getenv("INFLUX_URL"))
print(os.getenv("INFLUX_TOKEN"))
print(os.getenv("INFLUX_ORG"))

client = InfluxDBClient(
    url=os.getenv("INFLUX_URL"),
    token=os.getenv("INFLUX_TOKEN"),
    org=os.getenv("INFLUX_ORG")
)

query_api = client.query_api()

# Import our database services
from database_service import DatabaseService
from postgres_service import PostgresService
from notification_service import NotificationService

# Data Models
class SensorDataPoint(BaseModel):
    machineId: str
    temperature: float
    vibration: float
    pressure: float
    rpm: float
    current: float
    voltage: float
    load: float
    flowRate: float
    powerConsumption: float
    timestamp: datetime

class MachineState(BaseModel):
    id: str
    name: str
    type: str
    operationalState: str
    health: float
    rul: float
    efficiency: float
    performanceScore: float
    anomalyScore: float
    maintenanceUrgency: str
    timestamp: datetime

class AIPrediction(BaseModel):
    machineId: str
    healthScore: float
    rulHours: float
    failureProbability: float
    performanceScore: float
    efficiency: float
    anomalyScore: float
    maintenanceUrgency: str
    predictedFailures: List[Dict[str, Any]]
    timestamp: datetime

class AlertData(BaseModel):
    machineId: str
    type: str
    severity: str
    message: str
    timestamp: datetime
    acknowledged: bool = False

class NotificationRequest(BaseModel):
    type: str
    recipient: str
    subject: str
    message: str
    priority: str
    machineId: str
    alertId: Optional[str] = None

# Initialize FastAPI app
app = FastAPI(
    title="Industrial AI Predictive Maintenance API",
    description="REST API for real-time sensor data and AI predictions",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ WebSocket connected: {len(self.active_connections)} active connections")

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"❌ WebSocket disconnected: {len(self.active_connections)} active connections")

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                print(f"❌ Error broadcasting to WebSocket: {e}")

manager = ConnectionManager()

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Industrial AI Predictive Maintenance API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/sensor-data", response_model=SensorDataPoint)
async def receive_sensor_data(data: SensorDataPoint):
    try:
        # Process sensor data
        print(f"📡 Received sensor data from machine {data.machineId}")
        
        # Here you would integrate with InfluxDB
        # await DatabaseService.writeSensorData(data.machineId, [data])
        
        # Broadcast to WebSocket clients
        await manager.broadcast({
            "type": "sensor_data",
            "machineId": data.machineId,
            "data": data.dict(),
            "timestamp": datetime.now().isoformat()
        })
        
        return {"status": "success", "message": "Sensor data received"}
    
    except Exception as e:
        print(f"❌ Error processing sensor data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/machine-state", response_model=MachineState)
async def update_machine_state(data: MachineState):
    try:
        print(f"📡 Received machine state update for {data.machineId}")
        
        # Here you would integrate with InfluxDB
        # await DatabaseService.writePredictionData(prediction)
        
        # Broadcast to WebSocket clients
        await manager.broadcast({
            "type": "machine_state",
            "machineId": data.machineId,
            "data": data.dict(),
            "timestamp": datetime.now().isoformat()
        })
        
        return {"status": "success", "message": "Machine state updated"}
    
    except Exception as e:
        print(f"❌ Error updating machine state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-prediction", response_model=AIPrediction)
async def receive_ai_prediction(data: AIPrediction):
    try:
        print(f"🤖 Received AI prediction for machine {data.machineId}")
        
        # Here you would integrate with InfluxDB
        # await DatabaseService.writePredictionData(data)
        
        # Broadcast to WebSocket clients
        await manager.broadcast({
            "type": "ai_prediction",
            "machineId": data.machineId,
            "data": data.dict(),
            "timestamp": datetime.now().isoformat()
        })
        
        return {"status": "success", "message": "AI prediction received"}
    
    except Exception as e:
        print(f"❌ Error processing AI prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/alert", response_model=AlertData)
async def create_alert(data: AlertData):
    try:
        print(f"🚨 Received alert: {data.message}")
        
        # Save to PostgreSQL
        alertId = await PostgresService.saveAlert(data.dict())
        
        # Broadcast to WebSocket clients
        await manager.broadcast({
            "type": "alert",
            "machineId": data.machineId,
            "data": data.dict(),
            "timestamp": datetime.now().isoformat()
        })
        
        return {"status": "success", "message": "Alert created", "alertId": alertId}
    
    except Exception as e:
        print(f"❌ Error creating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notification", response_model=NotificationRequest)
async def send_notification(data: NotificationRequest):
    try:
        print(f"📧 Sending {data.type} notification to {data.recipient}")
        
        # Send notification
        result = await NotificationService.sendNotification(data.dict())
        
        return {"status": "success", "message": f"{data.type.capitalize()} notification sent", "result": result}
    
    except Exception as e:
        print(f"❌ Error sending {data.type} notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notification-history", response_model=List[Dict[str, Any]])
async def get_notification_history(limit: int = 50):
    try:
        print(f"📋 Retrieved {limit} notifications from database")
        
        # Get notification history
        history = await NotificationService.getNotificationHistory(limit=limit)
        
        return {"notifications": history, "count": len(history)}
    
    except Exception as e:
        print(f"❌ Error retrieving notification history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/machines")
async def get_machines():

    try:

        query = f'''
        from(bucket: "{os.getenv("INFLUX_BUCKET")}")
          |> range(start: -1m)
          |> filter(fn: (r) => r["_measurement"] == "machine_metrics_v2")
          |> filter(fn: (r) => r["_field"] != "risk_score")
          |> filter(fn: (r) => r["_field"] != "risk_label")
          |> last()
        '''

        result = query_api.query(
            org=os.getenv("INFLUX_ORG"),
            query=query
        )

        machines = {}

        for table in result:
            for record in table.records:

                machine = record.values.get("machine")
                field = record.get_field()

                if machine not in machines:
                    machines[machine] = {
                        "machine": machine,
                        "time": str(record.get_time())
                    }

                machines[machine][field] = record.get_value()

        machine_list = list(machines.values())

        print(f"📋 Retrieved {len(machine_list)} machines")

        return {
            "machines": machine_list,
            "count": len(machine_list)
        }

    except Exception as e:
        print(f"❌ Error retrieving machines: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts")
async def get_alerts(limit: int = 50):
    try:
        # Here you would integrate with PostgreSQL
        # alerts = await DatabaseService.getAlerts(limit=limit)
        
        # Return mock alerts for now
        alerts = [
            {
                "id": "alert_001",
                "machineId": "MACHINE_01",
                "type": "threshold",
                "severity": "medium",
                "message": "Temperature exceeding normal range",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False
            }
        ]
        
        print(f"🚨 Retrieved {len(alerts)} alerts")
        return {"alerts": alerts, "count": len(alerts)}
    
    except Exception as e:
        print(f"❌ Error retrieving alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages (keep connection alive)
            data = await websocket.receive_text()
            if data:
                try:
                    message = json.loads(data)
                    print(f"📡 Received WebSocket message: {message}")
                    
                    # Echo back or process the message
                    await websocket.send_text(json.dumps({
                        "type": "echo",
                        "message": "Received",
                        "timestamp": datetime.now().isoformat()
                    }))
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON received: {data}")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)

# Alert Engine (Simplified for now)
class AlertEngine:
    def __init__(self):
        self.threshold_rules = {
            "temperature": {"max": 75.0, "min": 20.0},
            "vibration": {"max": 5.0, "min": 0.0},
            "pressure": {"max": 15.0, "min": 0.5},
            "anomaly_score": {"critical": 0.7, "warning": 0.5}
        }
    
    def check_thresholds(self, data: SensorDataPoint) -> List[Dict[str, Any]]:
        alerts = []
        
        # Check temperature threshold
        if data.temperature > self.threshold_rules["temperature"]["max"]:
            alerts.append({
                "type": "threshold",
                "severity": "critical",
                "message": f"Temperature {data.temperature}°C exceeds maximum {self.threshold_rules['temperature']['max']}°C",
                "machineId": data.machineId,
                "timestamp": datetime.now().isoformat()
            })
        
        # Check vibration threshold
        if data.vibration > self.threshold_rules["vibration"]["max"]:
            alerts.append({
                "type": "threshold",
                "severity": "high",
                "message": f"Vibration {data.vibration} mm/s exceeds maximum {self.threshold_rules['vibration']['max']} mm/s",
                "machineId": data.machineId,
                "timestamp": datetime.now().isoformat()
            })
        
        return alerts

# Global alert engine instance
alert_engine = AlertEngine()

# Initialize services on startup
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Industrial AI Predictive Maintenance API...")
    
    # Initialize all services
    await DatabaseService.initialize()
    await PostgresService.initialize()
    NotificationService.initialize()
    
    print("📡 Available endpoints:")
    print("  GET  /health - Health check")
    print("  GET  /api/machines - Get all machines") 
    print("  POST /api/sensor-data - Receive sensor data")
    print("  POST /api/machine-state - Update machine state")
    print("  POST /api/ai-prediction - Receive AI predictions")
    print("  POST /api/alert - Create alert")
    print("  GET  /api/alerts - Get alerts")
    print("  POST /api/notification - Send email/SMS notification")
    print("  GET  /api/notification-history - Get notification history")
    print("  WS   /ws - WebSocket for real-time updates")
    print("🔗 WebSocket support enabled for real-time communication")
    print("🏥 Database integration ready (InfluxDB + PostgreSQL)")
    print("🚨 Alert engine with threshold rules")
    print("📧 Email/SMS notification system ready")
    print("📊 Ready to receive industrial sensor data")

# Background task to monitor and generate alerts
async def background_monitoring():
    while True:
        await asyncio.sleep(5)  # Check every 5 seconds
        print("🔍 Running background monitoring...")
        
        # Here you would get latest sensor data from InfluxDB
        # latest_data = await DatabaseService.getLatestSensorData()
        
        # For now, simulate with random data
        import random
        mock_data = SensorDataPoint(
            machineId="MACHINE_01",
            temperature=65.0 + random.uniform(-5, 10),
            vibration=2.1 + random.uniform(-0.5, 1.0),
            pressure=8.5 + random.uniform(-1, 2),
            rpm=1200 + random.uniform(-50, 100),
            current=120 + random.uniform(-10, 20),
            voltage=480 + random.uniform(-20, 30),
            load=75 + random.uniform(-10, 15),
            flowRate=250 + random.uniform(-20, 30),
            powerConsumption=45 + random.uniform(-5, 10),
            timestamp=datetime.now()
        )
        
        # Check for alerts
        alerts = alert_engine.check_thresholds(mock_data)
        
        if alerts:
            for alert in alerts:
                print(f"🚨 ALERT: {alert['message']}")
                # Broadcast to WebSocket clients
                await manager.broadcast({
                    "type": "system_alert",
                    "data": alert,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Save to PostgreSQL and send notifications
                for alert_data in alerts:
                    alert_id = await PostgresService.saveAlert({
                        machineId: alert_data['machineId'],
                        type: alert_data['type'],
                        severity: alert_data['severity'],
                        message: alert_data['message'],
                        timestamp: datetime.now()
                    })
                    
                    # Send notification
                    await NotificationService.sendNotification({
                        type: 'email',
                        recipient: 'manager@company.com',
                        subject: f"Industrial Alert: {alert_data['severity'].upper()}",
                        message: alert_data['message'],
                        priority: alert_data['severity'],
                        machineId: alert_data['machineId'],
                        alertId: alert_id
                    })

# Startup event
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Industrial AI Predictive Maintenance API...")
    
    # Initialize all services
    await DatabaseService.initialize()
    await PostgresService.initialize()
    NotificationService.initialize()
    
    print("📡 Available endpoints:")
    print("  GET  /health - Health check")
    print("  GET  /api/machines - Get all machines") 
    print("  POST /api/sensor-data - Receive sensor data")
    print("  POST /api/machine-state - Update machine state")
    print("  POST /api/ai-prediction - Receive AI predictions")
    print("  POST /api/alert - Create alert")
    print("  GET  /api/alerts - Get alerts")
    print("  POST /api/notification - Send email/SMS notification")
    print("  GET  /api/notification-history - Get notification history")
    print("  WS   /ws - WebSocket for real-time updates")
    print("🔗 WebSocket support enabled for real-time communication")
    print("🏥 Database integration ready (InfluxDB + PostgreSQL)")
    print("🚨 Alert engine with threshold rules")
    print("📧 Email/SMS notification system ready")
    print("📊 Ready to receive industrial sensor data")

if __name__ == "__main__":
    import uvicorn
    
    # Run the FastAPI app
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
