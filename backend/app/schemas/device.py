from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..models.device import DeviceStatus

class DeviceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    model: Optional[str] = Field(None, max_length=50)
    alert_sms_template_id: Optional[int] = Field(None, description="ID шаблона команды для SMS-оповещений из command_templates")
    send_alert_sms: bool = Field(False, description="Флаг для отправки SMS-оповещений при срабатывании алерта")
    description: Optional[str] = None
    grafana_uid: Optional[str] = Field(None, max_length=100)

class DeviceCreate(DeviceBase):
    status: DeviceStatus = DeviceStatus.OFFLINE
    phone: str = Field(..., pattern=r"^\+?[0-9\s\-\(\)]+$")
    platform_id: Optional[int] = Field(None, description="ID платформы для привязки устройства")

class DeviceUpdate(DeviceBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[DeviceStatus] = None

class DeviceInDB(DeviceBase):
    id: int
    status: DeviceStatus
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9\s\-\(\)]+$")
    last_update: Optional[datetime] = None
    created_at: datetime
    platform_id: Optional[int] = None

    class Config:
        from_attributes = True

class Device(DeviceInDB):
    pass

# Схема для вебхука Grafana
class GrafanaWebhookAlert(BaseModel):
    status: str  # firing или resolved
    labels: dict
    annotations: dict
    startsAt: datetime
    endsAt: Optional[datetime]
    generatorURL: str 