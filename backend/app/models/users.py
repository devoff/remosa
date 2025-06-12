from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.sql import func # Добавлено для func.utcnow
from app.db.base import Base
from datetime import datetime # Добавлено для datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=func.utcnow()) # Используем func.utcnow() для создания
    updated_at = Column(DateTime, default=func.utcnow(), onupdate=func.utcnow()) # Используем func.utcnow() для обновления 