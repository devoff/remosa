from sqlalchemy.orm import Session
from app.models.log import Log
from app.schemas.log import LogCreate

class LogService:
    @staticmethod
    async def get_logs(db: Session):
        return []

    @staticmethod
    async def create_log(db: Session, log: LogCreate):
        return {"id": 1, "device_id": log.device_id, "message": log.message, "level": log.level} 