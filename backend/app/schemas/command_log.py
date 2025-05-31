from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CommandLogBase(BaseModel):
    device_id: Optional[int] = None
    message: str
    command: Optional[str] = None
    level: str
    status: Optional[str] = None
    response: Optional[str] = None
    execution_time: Optional[datetime] = None
    extra_data: Optional[str] = None

class CommandLogCreate(CommandLogBase):
    pass

class CommandLogResponse(CommandLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
