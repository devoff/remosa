from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate
from typing import List, Optional
from datetime import datetime

class AuditLogService:
    @staticmethod
    def create_log(db: Session, log_data: AuditLogCreate) -> AuditLog:
        log_entry = AuditLog(**log_data.model_dump())
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_logs(
        db: Session,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        platform_id: Optional[int] = None,
        device_id: Optional[int] = None,
    ) -> List[AuditLog]:
        query = db.query(AuditLog)

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))

        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
            
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)

        if platform_id:
            query = query.filter(AuditLog.platform_id == platform_id)
        if device_id:
            query = query.filter(AuditLog.device_id == device_id)

        return query.order_by(AuditLog.timestamp.desc()).all() 