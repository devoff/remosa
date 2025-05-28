from sqlalchemy.orm import Session
from app.models.device import Device
from app.schemas.device import DeviceCreate

class DeviceService:
    @staticmethod
    async def get_devices(db: Session):
        devices = db.query(Device).all()
        return devices

    @staticmethod
    async def create_device(db: Session, device: DeviceCreate):
        db_device = Device(
            name=device.name,
            status=device.status
        )
        db.add(db_device)
        db.commit()
        db.refresh(db_device)
        return db_device 