from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ExporterConfiguration(Base):
    __tablename__ = "exporter_configurations"

    id = Column(Integer, primary_key=True, index=True)
    exporter_id = Column(Integer, ForeignKey("exporters.id"), nullable=False)
    
    # Настройки для CubicMedia
    api_endpoint = Column(String(500), nullable=True)  # URL API для сбора данных
    mac_addresses = Column(JSON, nullable=True)  # Список MAC адресов для мониторинга
    polling_interval = Column(Integer, default=30)  # Интервал опроса в секундах
    timeout = Column(Integer, default=15)  # Таймаут запросов в секундах
    
    # Настройки для Addreality (будущие)
    addreality_config = Column(JSON, nullable=True)  # Конфигурация для Addreality
    
    # Общие настройки
    prometheus_labels = Column(JSON, nullable=True)  # Дополнительные лейблы для Prometheus
    retry_count = Column(Integer, default=3)  # Количество попыток при ошибке
    cache_enabled = Column(Boolean, default=True)  # Включение кэширования
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Отношения
    exporter = relationship("Exporter", back_populates="configurations") 