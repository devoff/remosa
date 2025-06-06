from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app.core.database import Base # Импортируем Base из центрального места

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")

    # Будущие отношения с UserLimits и Device
    user_limits = relationship("UserLimits", back_populates="user", uselist=False)
    devices = relationship("Device", back_populates="owner") 