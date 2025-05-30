from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_KEY", "")
)

app = FastAPI(title="Remosa.ru Monitoring System API")

# CORS settings with explicit WebSocket support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Data models
class Alert(BaseModel):
    id: Optional[str] = None
    title: str
    status: str  # firing/resolved
    severity: str  # critical/warning/info
    player_name: str
    player_id: str
    platform: str
    description: Optional[str] = None
    metrics: Optional[dict] = None
    source: str = "system"
    source_id: Optional[str] = None

class AlertHistory(BaseModel):
    alert_id: str
    status: str
    comment: Optional[str] = None
    user_id: Optional[str] = None

class TelegramMessage(BaseModel):
    chat_id: str
    message: str

# WebSocket manager for handling multiple connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                await self.disconnect(connection)

manager = ConnectionManager()

# WebSocket endpoint with proper error handling
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await manager.connect(websocket)
        while True:
            try:
                data = await websocket.receive_text()
                await manager.broadcast(data)
            except Exception as e:
                print(f"Error handling WebSocket message: {e}")
                break
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        manager.disconnect(websocket)

# REST API endpoints
@app.get("/alerts")
async def get_alerts():
    response = supabase.table("alerts").select("*").execute()
    return response.data

@app.post("/alerts")
async def create_alert(alert: Alert):
    # Create alert
    response = supabase.table("alerts").insert({
        "title": alert.title,
        "status": alert.status,
        "severity": alert.severity,
        "player_name": alert.player_name,
        "player_id": alert.player_id,
        "platform": alert.platform,
        "description": alert.description,
        "metrics": alert.metrics,
        "source": alert.source,
        "source_id": alert.source_id
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create alert")
    
    new_alert = response.data[0]
    
    # Create history record
    history_response = supabase.table("alert_history").insert({
        "alert_id": new_alert["id"],
        "status": alert.status,
        "comment": f"Alert created with status: {alert.status}"
    }).execute()
    
    # Notify connected clients
    await manager.broadcast(json.dumps(new_alert))
    
    return new_alert

@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: str):
    response = supabase.table("alerts").select("*").eq("id", alert_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return response.data[0]

@app.put("/alerts/{alert_id}")
async def update_alert(alert_id: str, alert: Alert):
    # Update alert
    response = supabase.table("alerts").update({
        "status": alert.status,
        "severity": alert.severity,
        "description": alert.description,
        "metrics": alert.metrics,
        "resolved_at": datetime.now().isoformat() if alert.status == "resolved" else None
    }).eq("id", alert_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    updated_alert = response.data[0]
    
    # Create history record
    history_response = supabase.table("alert_history").insert({
        "alert_id": alert_id,
        "status": alert.status,
        "comment": f"Alert updated to status: {alert.status}"
    }).execute()
    
    # Notify connected clients
    await manager.broadcast(json.dumps(updated_alert))
    
    return updated_alert

@app.get("/alerts/{alert_id}/history")
async def get_alert_history(alert_id: str):
    response = supabase.table("alert_history").select("*").eq("alert_id", alert_id).order("created_at.desc").execute()
    return response.data

@app.get("/stats")
async def get_stats():
    # Get alerts statistics
    alerts_response = supabase.table("alerts").select("*").execute()
    alerts = alerts_response.data
    
    stats = {
        "total_alerts": len(alerts),
        "firing_alerts": len([a for a in alerts if a["status"] == "firing"]),
        "resolved_alerts": len([a for a in alerts if a["status"] == "resolved"]),
        "by_severity": {
            "critical": len([a for a in alerts if a["severity"] == "critical"]),
            "warning": len([a for a in alerts if a["severity"] == "warning"]),
            "info": len([a for a in alerts if a["severity"] == "info"]),
        }
    }
    return stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)