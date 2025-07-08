from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # Добавлено для func.utcnow()
from app.db.base_class import Base # Убедитесь, что это правильный импорт

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user", nullable=False)
    platform_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Отношения
    devices = relationship("Device", back_populates="user")
    user_limits = relationship("UserLimits", back_populates="user", uselist=False)
    platforms = relationship("PlatformUser", back_populates="user")

    @property
    def is_superadmin(self) -> bool:
        return self.role == "superadmin"
    
    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, role={self.role})" 