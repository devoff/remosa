from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Device, Log # Убедитесь, что Log импортирован из app.models
from datetime import datetime, timedelta
from app.core.auth import get_current_user # Добавил импорт get_current_user
from app.models.user import User # Добавил импорт User

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Добавил зависимость
):
    """Get dashboard statistics."""
    # Расчет Uptime (заглушка: реальный uptime нужно получать из системных данных)
    # Для примера, пусть система "работает" 2 дня
    uptime_seconds = (datetime.now() - datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=2)).total_seconds()
    hours = int(uptime_seconds // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    uptime_str = f"{hours}ч {minutes}м"

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

    return {
        "uptime": uptime_str,
        "totalDevices": total_devices,
        "activeAlerts": active_alerts,
        "resolvedAlerts": resolved_alerts,
        "latestAlert": latest_alert_time,
        "dbStatus": "Онлайн", # Или количество соединений
        "dbConnections": db_connections,
        "apiStatus": "Онлайн", # Заглушка
        "telegramStatus": "Подключен" # Заглушка
    }
