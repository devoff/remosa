from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    alert_name = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    data = Column(JSON, nullable=True)
    severity = Column(String, nullable=True)
    status = Column(String, default="firing", nullable=False)
    grafana_player_id = Column(String, nullable=True)
    response = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    source = Column(String, nullable=False)
    title = Column(String, nullable=False)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    external_id = Column(String, unique=True, index=True, nullable=True)
    details = Column(JSONB, nullable=True)
    
    device = relationship("Device", back_populates="alerts") 