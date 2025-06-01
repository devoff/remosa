import json
import logging
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import ValidationError
from datetime import datetime, timezone

from app.core.database import get_db
from app.schemas.grafana import GrafanaWebhookPayload
from app.models.log import Log
from app.models.device import Device
from app.schemas.log import LogCreate

router = APIRouter()

# Настраиваем логгер
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO) # Устанавливаем уровень логирования INFO

@router.post("/grafana-webhook/")
async def grafana_webhook(payload: GrafanaWebhookPayload, db: Session = Depends(get_db)):
    logger.info(f"Получен вебхук Grafana. Полезная нагрузка: {payload.model_dump_json(indent=2)}")
    for alert in payload.alerts:
        alert_name = alert.labels.alertname
        alert_status = alert.status
        player_name = alert.labels.player_name or "Неизвестный плеер"
        player_id_str = alert.labels.player_id # Используем отдельную переменную для строкового ID
        platform = alert.labels.platform or "Неизвестная платформа"
        summary = payload.commonAnnotations.summary
        starts_at = alert.startsAt
        ends_at = alert.endsAt

        # Обрезаем миллисекунды до микросекунд для starts_at и ends_at
        def truncate_microseconds(dt_str: str) -> str:
            if not dt_str:
                return dt_str
            # Regex для поиска дробной части секунд и обрезки до 6 знаков
            match = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d{1,6})?(\d*)([+-]\d{2}:\d{2}|Z)$", dt_str)
            if match:
                base = match.group(1)
                microseconds = match.group(2) or ".000000"
                tz_info = match.group(4)
                return f"{base}{microseconds[:7]}{tz_info}" # Обрезаем до .xxxxxx
            return dt_str # Возвращаем оригинал, если не соответствует паттерну

        processed_starts_at = truncate_microseconds(starts_at)
        processed_ends_at = truncate_microseconds(ends_at)

        logger.info(f"Обработка алерта: alert_name={alert_name}, status={alert_status}, player_id_str={player_id_str}")

        # Поиск device_id по player_id
        device_id_for_log = None
        if player_id_str:
            # Ищем устройство по grafana_uid
            device = db.query(Device).filter(Device.grafana_uid == player_id_str).first()
            if device:
                device_id_for_log = device.id
                logger.info(f"Найден device_id: {device_id_for_log} для grafana_uid: {player_id_str}")
            else:
                logger.warning(f"Устройство с grafana_uid {player_id_str} не найдено.")
        else:
            logger.info("player_id отсутствует в алерте Grafana.")

        message = f"🚨 АЛЕРТ: {alert_name} ({alert_status.upper()})\n\nПлеер: {player_name} ({player_id_str or 'N/A'})\nПлатформа: {platform}\nОписание: {summary}"
        
        # Подготовка extra_data
        extra_data = {
            "alert_name": alert_name,
            "player_name": player_name,
            "player_id": player_id_str,
            "platform": platform,
            "summary": summary,
            "startsAt": processed_starts_at,
            "endsAt": processed_ends_at
        }

        # Логика для resolved алертов: найти и обновить существующий firing алерт
        if alert_status.lower() == "resolved":
            # Ищем активный алерт с таким же именем и device_id
            # Используем extra_data -> 'alert_name' и 'player_id' для поиска
            existing_firing_alert = db.query(Log).filter(
                Log.level == "alert",
                Log.status == "firing",
                Log.device_id == device_id_for_log,
                Log.extra_data.cast(json.JSONB)["alert_name"].astext == alert_name,
                Log.extra_data.cast(json.JSONB)["player_id"].astext == player_id_str
            ).first()

            if existing_firing_alert:
                logger.info(f"Найден активный алерт (ID: {existing_firing_alert.id}) для разрешения. Обновляю статус и endsAt.")
                existing_firing_alert.status = alert_status
                try:
                    existing_firing_alert.updated_at = datetime.fromisoformat(processed_ends_at.replace("Z", "+00:00"))
                except ValueError:
                    logger.error(f"Некорректный формат даты endsAt для resolved алерта: {processed_ends_at}")
                    existing_firing_alert.updated_at = None
                db.add(existing_firing_alert)
                db.commit()
                db.refresh(existing_firing_alert)
                logger.info(f"Успешно обновлен лог алерта с id: {existing_firing_alert.id}")
                continue # Переходим к следующему алерту в payload

        # Если это firing алерт, или resolved алерт без соответствующего firing, создаем новый лог
        try:
            db_log = Log(
                message=message,
                level="alert",
                device_id=device_id_for_log,
                status=alert_status,
                extra_data=extra_data, # extra_data теперь dict, так как поле JSONB
                created_at=datetime.fromisoformat(processed_starts_at.replace("Z", "+00:00")),
                updated_at=None # updated_at устанавливается только при разрешении, если это новый firing алерт, он будет None
            )
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            logger.info(f"Успешно добавлен новый лог алерта с id: {db_log.id}")
        except ValidationError as e:
            logger.error(f"Ошибка валидации Pydantic при создании лога: {e.errors()}")
            raise HTTPException(status_code=422, detail=e.errors())
        except Exception as e:
            logger.error(f"Ошибка при сохранении лога в БД: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при сохранении лога.")

    return {"status": "success", "message": "Webhook received and processed"}

@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    logger.info(f"Получен запрос на разрешение алерта с ID: {alert_id}")
    db_log = db.query(Log).filter(Log.id == alert_id, Log.level == "alert", Log.status == "firing").first()

    if not db_log:
        raise HTTPException(status_code=404, detail="Активный алерт не найден или уже разрешен")

    db_log.status = "resolved"
    db_log.updated_at = datetime.now(timezone.utc) # Устанавливаем текущее время разрешения
    
    try:
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        logger.info(f"Алерт с ID {alert_id} успешно переведен в статус 'resolved'.")
        return {"status": "success", "message": f"Алерт {alert_id} успешно разрешен"}
    except Exception as e:
        logger.error(f"Ошибка при разрешении алерта с ID {alert_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при разрешении алерта.") 