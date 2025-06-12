from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: Optional[str] = "user"
    platform_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str  # Поле называется username для совместимости с фронтендом, но на самом деле это email
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class UserUpdate(UserBase):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    platform_id: Optional[int] = None 