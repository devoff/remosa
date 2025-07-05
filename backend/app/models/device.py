from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLAlchemyEnum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base
import sqlalchemy as sa

class DeviceStatus(enum.Enum):
    ONLINE = "ONLINE"
    WARNING = "WARNING"
    OFFLINE = "OFFLINE"

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLAlchemyEnum(DeviceStatus), default=DeviceStatus.OFFLINE, server_default=DeviceStatus.OFFLINE.value, nullable=False)
    last_update = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    grafana_uid = Column(String(100), nullable=True, unique=True)  # Для связи с Grafana
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Связь с пользователем
    phone = Column(String(20), nullable=True)  # Убедитесь, что тип String
    model = Column(String(50), nullable=True)  # Новое поле
    alert_sms_template_id = Column(Integer, ForeignKey("command_templates.id"), nullable=True) # ID шаблона команды для SMS-оповещений
    send_alert_sms = Column(sa.Boolean, default=False, nullable=False) # Флаг для отправки SMS-оповещений
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=True)
    # Отношения
    client = relationship("Client", back_populates="devices")
    user = relationship("User", back_populates="devices")  # Связь с пользователем
    alerts = relationship("Alert", back_populates="device")
    command_logs = relationship("Log", back_populates="device")
    platform = relationship("Platform", back_populates="devices")
    jobs = relationship("Job", back_populates="device")
 