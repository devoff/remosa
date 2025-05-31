from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CommandLogBase(BaseModel):
    device_id: int
    command: str
    level: str
    response: Optional[str] = None

class CommandLogCreate(CommandLogBase):
    pass

class CommandLogResponse(CommandLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
