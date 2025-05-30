from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..models.device import DeviceStatus

class DeviceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    grafana_uid: Optional[str] = Field(None, max_length=100)

class DeviceCreate(DeviceBase):
    status: DeviceStatus = DeviceStatus.OFFLINE

class DeviceUpdate(DeviceBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[DeviceStatus] = None

class DeviceInDB(DeviceBase):
    id: int
    status: DeviceStatus
    last_update: Optional[datetime] = None
    created_at: datetime

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