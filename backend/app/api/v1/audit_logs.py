from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.schemas.audit_log import AuditLogResponse, AuditLogCreate
from app.services.audit_log_service import AuditLogService
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """Get all audit logs with filters."""
    logs = AuditLogService.get_logs(
        db, 
        user_id=user_id, 
        action=action, 
        start_date=start_date, 
        end_date=end_date
    )
    return logs

# This is an example of how to log an action.
# We will integrate this into other endpoints later.
@router.post("/test-log", response_model=AuditLogResponse)
async def create_test_log(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a test audit log entry."""
    log_data = AuditLogCreate(
        user_id=current_user.id,
        action="TEST_ACTION",
        details=f"User {current_user.email} performed a test action.",
        ip_address=request.client.host
    )
    return AuditLogService.create_log(db, log_data) 