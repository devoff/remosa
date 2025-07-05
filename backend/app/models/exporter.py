from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLAlchemyEnum, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class ExporterType(enum.Enum):
    CUBIC_MEDIA = "cubic_media"
    ADDREALITY = "addreality"
    # Будущие типы экспортеров
    # CUSTOM = "custom"

class ExporterStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    CONFIGURING = "configuring"

class Exporter(Base):
    __tablename__ = "exporters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Тип и статус экспортера
    exporter_type = Column(SQLAlchemyEnum(ExporterType), nullable=False)
    status = Column(SQLAlchemyEnum(ExporterStatus), default=ExporterStatus.INACTIVE, nullable=False)
    
    # Привязка к платформе
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    
    # Конфигурация экспортера (JSON)
    config = Column(JSON, nullable=True)  # Настройки типа экспортера
    
    # Docker контейнер информация
    container_name = Column(String(200), nullable=True)
    container_port = Column(Integer, nullable=True)
    container_status = Column(String(50), nullable=True)
    
    # Метрики и статистика
    last_metrics_count = Column(Integer, default=0)  # Количество устройств в последнем сборе
    last_successful_collection = Column(DateTime(timezone=True), nullable=True)
    last_error_message = Column(Text, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Отношения
    platform = relationship("Platform", back_populates="exporters")
    configurations = relationship("ExporterConfiguration", back_populates="exporter")
    task_templates = relationship("TaskTemplate", back_populates="exporter") 