from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class DeviceStatus(enum.Enum):
    ONLINE = "ONLINE"
    WARNING = "WARNING"
    OFFLINE = "OFFLINE"

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(DeviceStatus), default=DeviceStatus.OFFLINE, server_default=DeviceStatus.OFFLINE.value, nullable=False)
    last_update = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    grafana_uid = Column(String(100), nullable=True, unique=True)  # Для связи с Grafana
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    
    # Отношения
    client = relationship("Client", back_populates="devices")
    alerts = relationship("Alert", back_populates="device")
    command_logs = relationship("CommandLog", back_populates="device") 