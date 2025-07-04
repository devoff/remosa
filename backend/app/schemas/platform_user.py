from pydantic import BaseModel
from typing import Optional

class PlatformUserBase(BaseModel):
    user_id: int
    role: str  # 'admin', 'manager', 'user', 'viewer'

class PlatformUserCreate(PlatformUserBase):
    pass

class PlatformUserUpdate(BaseModel):
    role: str

class PlatformUserOut(PlatformUserBase):
    id: int
    class Config:
        orm_mode = True 