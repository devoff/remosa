from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    recipients = Column(JSON, default=list)  # Список получателей
    job_id = Column(Integer, nullable=True)  # Связь с заданием
    status = Column(String(20), default='sent')  # sent, read, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Notification(id={self.id}, message='{self.message[:50]}...', status='{self.status}')>" 