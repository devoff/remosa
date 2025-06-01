from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class AlertBase(BaseModel):
    device_id: Optional[int] = Field(None, description="ID устройства, с которым связан алерт (если есть)")
    alert_name: str = Field(..., description="Имя алерта из Grafana")
    alert_type: str = Field(..., description="Тип алерта (например, 'CPU Usage', 'Disk Space')")
    message: str = Field(..., description="Текст сообщения алерта")
    data: Optional[Dict[str, Any]] = Field(None, description="Дополнительные данные алерта в формате JSON")
    severity: Optional[str] = Field(None, description="Серьезность алерта (например, 'critical', 'warning')")
    status: str = Field("firing", description="Статус алерта (например, 'firing', 'resolved')")
    grafana_player_id: Optional[str] = Field(None, description="ID плеера Grafana, сгенерировавшего алерт")
    response: Optional[str] = Field(None, description="Ответ от SMS-шлюза после попытки отправки уведомления")

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    created_at: datetime = Field(..., description="Дата и время создания алерта")
    updated_at: Optional[datetime] = Field(None, description="Дата и время последнего обновления алерта")

    class Config:
        from_attributes = True 