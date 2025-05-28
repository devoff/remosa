from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.device import DeviceService
from ...schemas.device import Device, DeviceCreate, DeviceUpdate, GrafanaWebhookAlert

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