from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable=True для обратной совместимости
    recipients = Column(JSON, default=list)  # Список получателей
    job_id = Column(Integer, nullable=True)  # Связь с заданием
    title = Column(String(255), nullable=True)  # nullable=True для обратной совместимости
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=True)  # 'alert', 'error', 'info', 'warning'
    status = Column(String(20), default='sent')  # sent, read, failed
    read_status = Column(Boolean, default=False, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationship
    user = relationship("User", back_populates="notifications", uselist=False)

    def __repr__(self):
        return f"<Notification(id={self.id}, message='{self.message[:50]}...', status='{self.status}')>" 
