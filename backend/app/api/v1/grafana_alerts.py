from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging  # Импортируем logging для детального вывода

from app.db.session import get_db
from app.models.alert import Alert as DBAlert # Импортируем нашу модель Alert
from app.schemas.grafana_alert import GrafanaWebhookPayload # Импортируем новую схему для вебхука Grafana

router = APIRouter()

@router.post("/grafana-webhook", status_code=status.HTTP_201_CREATED)
async def receive_grafana_webhook(request: Request, payload: GrafanaWebhookPayload, db: Session = Depends(get_db)):
    try:
        raw_body = await request.body()
        logging.info(f'DEBUG_WEBHOOK_RAW: Received raw payload: {raw_body.decode("utf-8")}')  # Логируем сырые данные
        logging.info(f'DEBUG_WEBHOOK_PAYLOAD: Received validated payload: {payload.dict()}')  # Логируем валидированный payload как словарь
        
        for alert_data in payload.alerts:
            details = alert_data.dict()
            def serialize_details(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                raise TypeError('Type not serializable')
            serialized_details = json.dumps(details, default=serialize_details)
            serialized_details = json.loads(serialized_details)
            
            db_alert = DBAlert(
                source="Grafana",
                title=payload.title if payload.title else alert_data.labels.alertname,
                message=alert_data.annotations.summary or alert_data.annotations.description or f"Alert: {alert_data.labels.alertname}",
                severity=alert_data.labels.severity if alert_data.labels.severity else "info",
                timestamp=alert_data.startsAt,
                external_id=alert_data.fingerprint,
                details=serialized_details,
                alert_name=alert_data.labels.alertname,
                alert_type=alert_data.labels.alertname,
                status=alert_data.status
            )
            db.add(db_alert)
        db.commit()
        return {"message": "Alerts received and processed successfully"}
    except Exception as e:
        logging.error(f'DEBUG_WEBHOOK_ERROR: Full error: {str(e)} - Payload: {payload.dict()}')  # Более детальное логирование ошибки
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/alerts", response_model=list[dict])
def get_alerts(
    *, 
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> list[dict]:
    try:
        # Добавляем отладку для URL сессии
        print(f'DEBUG_GRAFANA_SESSION: Database URL in session: {db.bind.engine.url}')  # Выводим URL из сессии
        alerts = db.query(DBAlert).offset(skip).limit(limit).all()
        return [alert.__dict__ for alert in alerts]
    except Exception as e:
        print(f'DEBUG_GRAFANA_ERROR: Error in query: {e}')  # Логируем ошибку
        raise HTTPException(status_code=500, detail=str(e)) 