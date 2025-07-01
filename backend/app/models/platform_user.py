from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class PlatformUser(Base):
    __tablename__ = "platform_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    role = Column(String, nullable=False)  # 'admin', 'manager', 'user', 'viewer'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="platforms")
    platform = relationship("Platform", back_populates="users")
