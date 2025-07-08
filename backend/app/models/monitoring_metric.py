from sqlalchemy import Column, Integer, String, Text, Boolean
from app.db.base_class import Base


class MonitoringMetric(Base):
    """Справочник метрик мониторинга"""
    __tablename__ = "monitoring_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    technical_name = Column(String(100), nullable=False, unique=True, index=True)  # remosa_exporter_cubic_device_status
    human_name = Column(String(200), nullable=False)  # Статус устройства
    description = Column(Text, nullable=True)  # Описание метрики
    unit = Column(String(50), nullable=True)  # Единица измерения (%, °C, Вт и т.д.)
    category = Column(String(100), nullable=False)  # Категория (Статус, Температура, Питание)
    data_type = Column(String(20), nullable=False, default="number")  # number, string, boolean
    min_value = Column(String(50), nullable=True)  # Минимальное значение
    max_value = Column(String(50), nullable=True)  # Максимальное значение
    is_active = Column(Boolean, default=True)  # Активна ли метрика 