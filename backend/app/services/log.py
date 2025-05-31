from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.log import Log
from app.schemas.log import LogCreate

class LogService:
    @staticmethod
    async def get_logs(db: Session, level: Optional[str] = None) -> List[Log]:
        query = db.query(Log)
        if level:
            query = query.filter(Log.level == level)
        return query.order_by(Log.created_at.desc()).all()

    @staticmethod
    async def create_log(db: Session, log: LogCreate) -> Log:
        db_log = Log(**log.model_dump())
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log 