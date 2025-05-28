from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import alerts, devices, clients, logs

app = FastAPI(title="Remosa Monitoring System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}

app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["devices"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["clients"])
app.include_router(logs.router, prefix="/api/v1/logs", tags=["logs"]) 