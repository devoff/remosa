from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Alert, Device
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.sms_gateway import SMSGateway

router = APIRouter()
sms_gateway = SMSGateway()

@router.post("/webhook", response_model=AlertResponse)
async def receive_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db)
):
    # Получаем устройство
    device = db.query(Device).filter_by(id=alert.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Создаем запись об алерте
    db_alert = Alert(
        device_id=device.id,
        alert_type=alert.alert_type,
        message=alert.message,
        data=alert.data
    )
    db.add(db_alert)
    
    try:
        # Отправляем команду через SMS-шлюз
        await sms_gateway.send_command(device.phone_number, alert.command)
        db_alert.status = "sent"
    except Exception as e:
        db_alert.status = "failed"
        db_alert.response = str(e)
    
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    alerts = db.query(Alert).offset(skip).limit(limit).all()
    return alerts

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert 