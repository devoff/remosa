from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class PlatformRole(BaseModel):
    platform_id: int
    role: str

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(UserBase):
    is_active: Optional[bool] = None
    role: Optional[str] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime
    updated_at: datetime
    platform_roles: List[PlatformRole] = []

    class Config:
        from_attributes = True 