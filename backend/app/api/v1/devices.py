from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate, Device as DeviceSchema

router = APIRouter()

@router.get("/", response_model=List[DeviceSchema])
async def get_devices(db: Session = Depends(get_db)):
    """Get all devices."""
    return db.query(Device).all()

@router.post("/", response_model=DeviceSchema)
async def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """Create a new device."""
    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.get("/{device_id}", response_model=DeviceSchema)
async def get_device(device_id: int, db: Session = Depends(get_db)):
    """Get a device by ID."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device

@router.put("/{device_id}", response_model=DeviceSchema)
async def update_device(device_id: int, device: DeviceUpdate, db: Session = Depends(get_db)):
    """Update a device."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    update_data = device.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_device, field, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{device_id}", response_model=DeviceSchema)
async def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Delete a device."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(db_device)
    db.commit()
    return db_device 