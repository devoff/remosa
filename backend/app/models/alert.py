from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    alert_type = Column(String)
    message = Column(String)
    data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="alerts") 