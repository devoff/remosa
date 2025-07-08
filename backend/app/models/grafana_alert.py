from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base

class GrafanaAlert(Base):
    __tablename__ = "grafana_alerts"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False) # Например, "Grafana"
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False) # Например, "critical", "warning", "info"
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    external_id = Column(String, unique=True, index=True, nullable=True) # ID из внешней системы (Grafana)
    details = Column(JSONB, nullable=True) # Произвольные детали в формате JSONB 