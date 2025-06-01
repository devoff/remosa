from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.models.alert import Alert as DBAlert
from app.schemas.grafana_alert import GrafanaWebhookPayload

router = APIRouter()

@router.post("/grafana-webhook", status_code=status.HTTP_201_CREATED)
def receive_grafana_webhook(
    *, 
    db: Session = Depends(get_db), 
    payload: GrafanaWebhookPayload
):
    """Принимает вебхуки от Grafana и сохраняет информацию об алерте."""
    
    for alert_data in payload.alerts:
        alert_name = alert_data.labels.alertname
        title = payload.title if payload.title else alert_name
        message = alert_data.annotations.summary or alert_data.annotations.description or f"Alert: {alert_name}"
        severity = alert_data.labels.severity if alert_data.labels.severity else "info"
        timestamp = alert_data.startsAt
        external_id = alert_data.fingerprint
        details = alert_data.dict()

        db_alert = DBAlert(
            source="Grafana",
            title=title,
            message=message,
            severity=severity,
            timestamp=timestamp,
            external_id=external_id,
            details=details,
            alert_name=alert_name,
            alert_type=alert_name,
            status=alert_data.status
        )
        db.add(db_alert)
    
    db.commit()
    return {"message": "Alerts received and processed successfully"}

@router.get("/alerts", response_model=list[dict])
def get_alerts(
    *, 
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> list[dict]:
    """Получает список всех алертов из таблицы alerts."""
    alerts = db.query(DBAlert).offset(skip).limit(limit).all()
    return [alert.__dict__ for alert in alerts] 