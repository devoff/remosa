from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PlatformBase(BaseModel):
    name: str
    description: Optional[str] = None
    devices_limit: Optional[int] = None
    sms_limit: Optional[int] = None

class PlatformCreate(PlatformBase):
    pass

class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    devices_limit: Optional[int] = None
    sms_limit: Optional[int] = None

class PlatformResponse(PlatformBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 