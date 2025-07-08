from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class LogBase(BaseModel):
    device_id: Optional[int] = None
    message: str
    level: str = "info"
    status: Optional[str] = None
    command: Optional[str] = None
    response: Optional[str] = None
    execution_time: Optional[datetime] = None
    extra_data: Optional[Dict[str, Any]] = None

class LogCreate(LogBase):
    pass

class LogResponse(LogBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 