from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class GrafanaAlertLabel(BaseModel):
    alertname: str
    grafana_folder: str
    instance: str
    job: Optional[str] = None
    platform: Optional[str] = None
    player_id: Optional[str] = None
    player_name: Optional[str] = None

class GrafanaAlert(BaseModel):
    endsAt: str
    labels: GrafanaAlertLabel
    startsAt: str
    status: str

class GrafanaCommonAnnotations(BaseModel):
    summary: str

class GrafanaCommonLabels(BaseModel):
    alertname: str
    grafana_folder: str
    instance: str
    job: Optional[str] = None
    platform: Optional[str] = None

class GrafanaWebhookPayload(BaseModel):
    alerts: Optional[List[GrafanaAlert]] = None
    allVariables: Optional[Dict] = None
    commonAnnotations: Optional[GrafanaCommonAnnotations] = None
    commonLabels: Optional[GrafanaCommonLabels] = None
    groupKey: Optional[str] = None
    groupLabels: Optional[Dict] = None
    message: Optional[str] = None
    orgId: Optional[int] = None
    receiver: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None
    truncatedAlerts: Optional[int] = None
    version: Optional[str] = None 