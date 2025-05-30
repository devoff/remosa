from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.log import LogCreate, LogResponse
from app.services.log import LogService

router = APIRouter()

@router.get("/", response_model=List[LogResponse])
async def get_logs(db: Session = Depends(get_db)):
    """Get all logs."""
    return []

@router.post("/", response_model=LogResponse)
async def create_log(log: LogCreate, db: Session = Depends(get_db)):
    """Create a new log entry."""
    return {"id": 1, "device_id": 1, "message": "Test log", "level": "info"} 