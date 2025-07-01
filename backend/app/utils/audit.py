from app.models.audit_log import AuditLog
from datetime import datetime

def log_audit(db, user_id, action, details, ip_address=None):
    log = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
