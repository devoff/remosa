from app.models.audit_log import AuditLog
from sqlalchemy.orm import Session

def log_audit(db: Session, action: str, user_id: int, platform_id: int = None, details: str = None):
    log = AuditLog(
        action=action,
        user_id=user_id,
        details=details
    )
    db.add(log)
    db.commit() 