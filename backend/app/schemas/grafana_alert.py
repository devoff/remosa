from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Any, Optional
from datetime import datetime

class GrafanaAlertLabel(BaseModel):
    alertname: str
    severity: Optional[str] = None
    # Добавьте другие метки, которые могут быть важны

class GrafanaAlertAnnotation(BaseModel):
    summary: Optional[str] = None
    description: Optional[str] = None
    # Добавьте другие аннотации

class GrafanaSingleAlert(BaseModel):
    status: str
    labels: GrafanaAlertLabel
    annotations: GrafanaAlertAnnotation
    startsAt: datetime
    endsAt: Optional[datetime] = None
    generatorURL: Optional[HttpUrl] = None
    fingerprint: str

class GrafanaWebhookPayload(BaseModel):
    receiver: str
    status: str
    alerts: List[GrafanaSingleAlert]
    externalURL: HttpUrl
    version: str
    groupKey: str
    truncatedAlerts: Optional[int] = 0
    title: str
    state: str
    message: Optional[str] = None
    orgId: int

class GrafanaAlertBase(BaseModel):
    source: str = Field(..., description="Источник алерта (например, 'Grafana')")
    title: str = Field(..., description="Заголовок алерта")
    message: str = Field(..., description="Сообщение алерта")
    severity: str = Field(..., description="Серьезность алерта (например, 'critical', 'warning', 'info')")
    external_id: Optional[str] = Field(None, description="ID алерта во внешней системе (Grafana)")
    details: Optional[Dict[str, Any]] = Field(None, description="Произвольные детали алерта в формате JSON")

class GrafanaAlertCreate(GrafanaAlertBase):
    pass

class GrafanaAlertResponse(GrafanaAlertBase):
    id: int
    timestamp: datetime = Field(..., description="Дата и время получения алерта")

    class Config:
        from_attributes = True 