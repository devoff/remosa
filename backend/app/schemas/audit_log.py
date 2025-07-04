from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogBase(BaseModel):
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    platform_id: Optional[int] = None
    device_id: Optional[int] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[int] = None

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: Optional[int]
    timestamp: datetime

    class Config:
        from_attributes = True 