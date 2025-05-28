from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.device import DeviceCreate, DeviceResponse
from app.services.device import DeviceService

router = APIRouter()
device_service = DeviceService()

@router.get("/", response_model=List[DeviceResponse])
async def get_devices(db: Session = Depends(get_db)):
    """Get all devices."""
    return await device_service.get_devices(db)

@router.post("/", response_model=DeviceResponse)
async def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """Create a new device."""
    return await device_service.create_device(db, device) 