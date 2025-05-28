from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LogBase(BaseModel):
    device_id: int
    message: str
    level: str = "info"

class LogCreate(LogBase):
    pass

class LogResponse(LogBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 