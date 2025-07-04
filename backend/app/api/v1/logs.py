from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.log import LogCreate, LogResponse
from app.services.log import LogService

router = APIRouter()

@router.get("/", response_model=List[LogResponse])
async def get_logs(db: Session = Depends(get_db), level: Optional[str] = None, platform_id: Optional[int] = None):
    """Get all logs, optionally filtered by level and platform_id."""
    return await LogService.get_logs(db, level=level, platform_id=platform_id)

@router.post("/", response_model=LogResponse)
async def create_log(log: LogCreate, db: Session = Depends(get_db)):
    """Create a new log entry."""
    return await LogService.create_log(db, log) 