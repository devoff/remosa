from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.device import DeviceService
from ...schemas.device import Device, DeviceCreate, DeviceUpdate, GrafanaWebhookAlert
from ...core.audit import log_audit
from ...core.auth import get_current_superadmin
from fastapi import status

router = APIRouter()

@router.get("/", response_model=List[Device])
def get_devices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список всех устройств"""
    return DeviceService.get_devices(db, skip=skip, limit=limit)

@router.post("/", response_model=Device)
def create_device(
    device: DeviceCreate,
    db: Session = Depends(get_db)
):
    """Создать новое устройство"""
    return DeviceService.create_device(db, device)

@router.get("/{device_id}", response_model=Device)
def get_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    """Получить устройство по ID"""
    db_device = DeviceService.get_device(db, device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device

@router.put("/{device_id}", response_model=Device)
def update_device(
    device_id: int,
    device: DeviceUpdate,
    db: Session = Depends(get_db)
):
    """Обновить устройство"""
    log_audit(db, action="update_device", user_id=user.id, device_id=device.id, platform_id=device.platform_id, details=f"Обновлено устройство {device.name}")
    return DeviceService.update_device(db, device_id, device)

@router.delete("/{device_id}", response_model=Device)
def delete_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    """Удалить устройство"""
    return DeviceService.delete_device(db, device_id)

@router.post("/webhook/grafana")
def grafana_webhook(
    alert: GrafanaWebhookAlert,
    db: Session = Depends(get_db)
):
    """Обработать вебхук от Grafana"""
    # Предполагаем, что grafana_uid хранится в labels
    grafana_uid = alert.labels.get("device_uid")
    if not grafana_uid:
        raise HTTPException(status_code=400, detail="device_uid not found in alert labels")
    
    return DeviceService.update_device_status(db, grafana_uid, alert.status)

@router.patch("/devices/{device_id}/move/{platform_id}", response_model=Device)
def move_device_to_platform(device_id: int, platform_id: int, db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    old_platform_id = db.query(Device).filter(Device.id == device_id).first().platform_id
    device = DeviceService.move_device(db, device_id, platform_id)
    log_audit(db, action="move_device", user_id=user.id, device_id=device.id, details=f"Устройство {device.name} перемещено с платформы {old_platform_id} на {platform_id}")
    return device

@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceService.delete_device(db, device_id) 