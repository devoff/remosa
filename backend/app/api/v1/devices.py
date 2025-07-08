from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate, Device as DeviceSchema
from app.services.device import DeviceService
from app.core.auth import get_current_user
from app.models.user import User
from app.core.audit import log_audit

router = APIRouter()

def require_superadmin(user: User):
    if user.role != 'superadmin':
        raise HTTPException(status_code=403, detail="Требуются права супер-администратора")

@router.get("/", response_model=List[DeviceSchema])
async def get_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all devices. (Superadmin only)"""
    require_superadmin(current_user)
    return db.query(Device).all()

@router.post("/", response_model=DeviceSchema)
async def create_device(
    device: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new device. (Superadmin only)"""
    require_superadmin(current_user)
    if device.phone:
        device.phone = device.phone.lstrip('+')
    # Супер-админ должен явно указать платформу при создании устройства
    if not device.platform_id:
        raise HTTPException(status_code=400, detail="platform_id является обязательным полем")
    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    log_audit(db, action="create_device", user_id=current_user.id, platform_id=db_device.platform_id, device_id=db_device.id, details=f"Создано устройство: {db_device.name}")
    return db_device

@router.get("/{device_id}", response_model=DeviceSchema)
async def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a device by ID. (Superadmin only)"""
    require_superadmin(current_user)
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device

@router.put("/{device_id}", response_model=DeviceSchema)
async def update_device(
    device_id: int,
    device: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a device. (Superadmin only)"""
    require_superadmin(current_user)
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    update_data = device.model_dump(exclude_unset=True)
    if "phone" in update_data and update_data["phone"] is not None:
        update_data["phone"] = update_data["phone"].lstrip('+')

    for field, value in update_data.items():
        setattr(db_device, field, value)
    
    db.commit()
    db.refresh(db_device)
    log_audit(db, action="update_device", user_id=current_user.id, platform_id=db_device.platform_id, device_id=db_device.id, details=f"Обновлено устройство: {db_device.name}")
    return db_device

@router.delete("/{device_id}", response_model=DeviceSchema)
async def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a device. (Superadmin only)"""
    require_superadmin(current_user)
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(db_device)
    db.commit()
    log_audit(db, action="delete_device", user_id=current_user.id, platform_id=db_device.platform_id, device_id=db_device.id, details=f"Удалено устройство: {db_device.name}")
    return db_device

@router.get("/search/")
async def search_devices(
    phone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search devices by phone. (Superadmin only)"""
    require_superadmin(current_user)
    return DeviceService.get_device_by_phone(db, phone)

@router.patch("/{device_id}/move/{platform_id}", response_model=DeviceSchema)
async def move_device_to_platform(
    device_id: int, 
    platform_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Move device to another platform. (Superadmin only)"""
    require_superadmin(current_user)
    
    # Получаем старую платформу для логирования
    old_device = db.query(Device).filter(Device.id == device_id).first()
    if not old_device:
        raise HTTPException(status_code=404, detail="Device not found")
    old_platform_id = old_device.platform_id
    
    # Перемещаем устройство
    device = DeviceService.move_device(db, device_id, platform_id)
    
    # Логируем действие
    log_audit(db, action="move_device", user_id=current_user.id, platform_id=platform_id, device_id=device.id, details=f"Устройство {device.name} перемещено с платформы {old_platform_id} на {platform_id}")
    
    return device 