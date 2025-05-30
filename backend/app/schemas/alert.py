from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AlertBase(BaseModel):
    device_id: int
    message: str
    severity: str
    status: str = "active"

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 