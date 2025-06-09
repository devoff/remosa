from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"
    is_superuser: Optional[bool] = False
    is_admin: Optional[bool] = False
    platform_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDBBase(UserBase):
    id: Optional[int] = None
    is_active: bool = True
    role: str
    is_superuser: bool
    is_admin: bool
    platform_id: Optional[int] = None

    class Config:
        orm_mode = True

class User(UserInDBBase):
    pass

class UserUpdate(UserBase):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    is_superuser: Optional[bool] = None
    is_admin: Optional[bool] = None
    platform_id: Optional[int] = None 