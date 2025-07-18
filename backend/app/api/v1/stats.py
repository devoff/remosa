from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Device, Log # Убедитесь, что Log импортирован из app.models
from datetime import datetime, timedelta
from app.core.auth import get_current_user # Добавил импорт get_current_user
from app.models.user import User # Добавил импорт User
from app.services.sms_gateway import SMSGateway
import asyncio
import aiohttp
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Добавил зависимость
):
    """Get dashboard statistics."""
    # Расчет Uptime на основе времени старта приложения
    start_time = request.app.state.start_time
    uptime_seconds = (datetime.now() - start_time).total_seconds()
    
    days = int(uptime_seconds // (24 * 3600))
    hours = int((uptime_seconds % (24 * 3600)) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)

    uptime_parts = []
    if days > 0:
        uptime_parts.append(f"{days}д")
    if hours > 0:
        uptime_parts.append(f"{hours}ч")
    if minutes > 0 or not uptime_parts:
        uptime_parts.append(f"{minutes}м")
    
    uptime_str = " ".join(uptime_parts)

    # Количество устройств
    total_devices = db.query(Device).count()

    # Количество активных и решенных алертов
    # Предполагаем, что алерты хранятся в модели Log с level='alert'
    # и статусами 'firing' (активные) и 'resolved' (решенные)
    active_alerts = db.query(Log).filter(Log.level == "alert", Log.status == "firing").count()
    resolved_alerts = db.query(Log).filter(Log.level == "alert", Log.status == "resolved").count()
    latest_alert_log = db.query(Log).filter(Log.level == "alert").order_by(Log.created_at.desc()).first()
    latest_alert_time = latest_alert_log.created_at.isoformat() if latest_alert_log else "N/A"

    # Статус БД (заглушка: в реальной системе нужна более сложная проверка)
    db_connections = 5 # Примерное количество соединений

    # Проверка статуса SMS шлюза
    sms_gateway = SMSGateway()
    try:
        # Пробуем отправить тестовый запрос к реальному эндпоинту SMS шлюза с авторизацией
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"{sms_gateway.api_key}"}
            async with session.get(f"{sms_gateway.base_url}/sms", headers=headers) as resp:
                sms_status = 'Подключен' if resp.status == 200 else 'Ошибка'
                logger.info(f"SMS шлюз статус: {resp.status}, ответ: {sms_status}")
    except Exception as e:
        logger.error(f"Ошибка проверки статуса SMS шлюза: {e}")
        sms_status = 'Ошибка'

    return {
        "uptime": uptime_str,
        "totalDevices": total_devices,
        "activeAlerts": active_alerts,
        "resolvedAlerts": resolved_alerts,
        "latestAlert": latest_alert_time,
        "dbStatus": "Онлайн", # Или количество соединений
        "dbConnections": db_connections,
        "apiStatus": "Онлайн", # Заглушка
        "telegramStatus": "Подключен", # Заглушка
        "smsStatus": sms_status
    }
