from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models.device import Device, DeviceStatus
from ..schemas.device import DeviceCreate, DeviceUpdate
from ..services.command_service import CommandService

class DeviceService:
    @staticmethod
    def get_device(db: Session, device_id: int) -> Optional[Device]:
        return db.query(Device).filter(Device.id == device_id).first()

    @staticmethod
    def get_device_by_grafana_uid(db: Session, grafana_uid: str) -> Optional[Device]:
        return db.query(Device).filter(Device.grafana_uid == grafana_uid).first()

    @staticmethod
    def get_devices(db: Session, skip: int = 0, limit: int = 100) -> List[Device]:
        return db.query(Device).offset(skip).limit(limit).all()

    @staticmethod
    def create_device(db: Session, device: DeviceCreate) -> Device:
        db_device = Device(**device.model_dump())
        db.add(db_device)
        db.commit()
        db.refresh(db_device)
        return db_device

    @staticmethod
    def update_device(db: Session, device_id: int, device: DeviceUpdate) -> Device:
        db_device = DeviceService.get_device(db, device_id)
        if not db_device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        update_data = device.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_device, field, value)
        
        db.commit()
        db.refresh(db_device)
        return db_device

    @staticmethod
    def delete_device(db: Session, device_id: int) -> Device:
        db_device = DeviceService.get_device(db, device_id)
        if not db_device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        db.delete(db_device)
        db.commit()
        return db_device

    @staticmethod
    def update_device_status(db: Session, grafana_uid: str, alert_status: str) -> Device:
        db_device = DeviceService.get_device_by_grafana_uid(db, grafana_uid)
        if not db_device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        # Преобразуем статус Grafana в статус устройства
        if alert_status == "firing":
            db_device.status = DeviceStatus.WARNING
        elif alert_status == "resolved":
            db_device.status = DeviceStatus.ONLINE
        
        db.commit()
        db.refresh(db_device)
        return db_device

    @staticmethod
    def get_device_by_phone(db: Session, phone: str) -> Optional[Device]:
        # Нормализуем номер телефона для поиска: удаляем символ '+'
        normalized_phone = phone.lstrip('+')
        return db.query(Device).filter(Device.phone == normalized_phone).first()

    @staticmethod
    def get_device_command_templates(db: Session, device_id: int) -> List[CommandService]:
        device = DeviceService.get_device(db, device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Устройство не найдено")
        
        return CommandService.get_templates(db, device.type) 