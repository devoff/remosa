from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserLogin(BaseModel):
    username: str
    password: str 