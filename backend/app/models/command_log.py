from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class CommandLog(Base):
    __tablename__ = "command_logs"
    
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    command = Column(String)
    status = Column(String)
    response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="command_logs") 