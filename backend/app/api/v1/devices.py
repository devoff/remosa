from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate, Device as DeviceSchema
from app.services.device import DeviceService
from app.core.auth import get_current_active_user, get_current_active_superuser
from app.models.user import User as UserModel
from app.models.user_limits import UserLimits as UserLimitsModel

router = APIRouter()

@router.get("/", response_model=List[DeviceSchema])
async def get_devices(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Get all devices for the current user or all devices if superuser."""
    if current_user.role == "superuser":
        return db.query(Device).all()
    else:
        return db.query(Device).filter(Device.user_id == current_user.id).all()

@router.post("/", response_model=DeviceSchema, status_code=status.HTTP_201_CREATED)
async def create_device(device: DeviceCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Create a new device for the current user, respecting device limits."""
    if current_user.role != "superuser":
        user_limits = db.query(UserLimitsModel).filter(UserLimitsModel.user_id == current_user.id).first()
        if not user_limits:
            raise HTTPException(status_code=404, detail="User limits not found for this user.")
        
        current_devices_count = db.query(Device).filter(Device.user_id == current_user.id).count()
        if current_devices_count >= user_limits.max_devices:
            raise HTTPException(status_code=400, detail=f"Device limit ({user_limits.max_devices}) reached for user {current_user.username}.")

    if device.phone:
        device.phone = device.phone.lstrip('+')
    
    db_device = Device(**device.model_dump(), user_id=current_user.id)
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.get("/{device_id}", response_model=DeviceSchema)
async def get_device(device_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Get a device by ID, ensuring ownership or superuser access."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if current_user.role != "superuser" and db_device.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this device")
    
    return db_device

@router.put("/{device_id}", response_model=DeviceSchema)
async def update_device(device_id: int, device: DeviceUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Update a device, ensuring ownership or superuser access."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if current_user.role != "superuser" and db_device.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this device")
    
    update_data = device.model_dump(exclude_unset=True)
    if "phone" in update_data and update_data["phone"] is not None:
        update_data["phone"] = update_data["phone"].lstrip('+')

    for field, value in update_data.items():
        setattr(db_device, field, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{device_id}", response_model=DeviceSchema)
async def delete_device(device_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Delete a device, ensuring ownership or superuser access."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if current_user.role != "superuser" and db_device.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this device")
    
    db.delete(db_device)
    db.commit()
    return db_device

@router.get("/search/")
async def search_devices(phone: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    """Search for devices by phone number, ensuring ownership or superuser access."""
    devices = DeviceService.get_device_by_phone(db, phone)
    
    if current_user.role == "superuser":
        return devices
    else:
        user_devices = [device for device in devices if device.user_id == current_user.id]
        return user_devices 