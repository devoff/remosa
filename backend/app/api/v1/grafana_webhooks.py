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
            try:
                player_id_int = int(player_id_str)
                device = db.query(Device).filter(Device.id == player_id_int).first()
                if device:
                    device_id_for_log = device.id
                    logger.info(f"Найден device_id: {device_id_for_log} для player_id: {player_id_str}")
                else:
                    logger.warning(f"Устройство с player_id {player_id_str} не найдено.")
            except ValueError as e:
                logger.error(f"Некорректный player_id: {player_id_str}. Невозможно преобразовать в число. Ошибка: {e}")
            except Exception as e:
                logger.error(f"Ошибка при поиске устройства по player_id {player_id_str}: {e}")
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

        # Установка updated_at только дляresolved алертов
        updated_at_for_log = None
        if alert_status.lower() == "resolved":
            try:
                updated_at_for_log = datetime.fromisoformat(processed_ends_at.replace("Z", "+00:00"))
            except ValueError:
                logger.error(f"Некорректный формат даты endsAt: {processed_ends_at}")
                pass # Просто используем None, если не удалось распарсить дату

        try:
            db_log = Log(
                message=message,
                level="alert",
                device_id=device_id_for_log,
                status=alert_status,
                extra_data=json.dumps(extra_data),
                created_at=datetime.fromisoformat(processed_starts_at.replace("Z", "+00:00")),
                updated_at=updated_at_for_log
            )
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            logger.info(f"Успешно добавлен лог алерта с id: {db_log.id}")
        except ValidationError as e:
            logger.error(f"Ошибка валидации Pydantic при создании лога: {e.errors()}")
            raise HTTPException(status_code=422, detail=e.errors())
        except Exception as e:
            logger.error(f"Ошибка при сохранении лога в БД: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при сохранении лога.")

    return {"status": "success", "message": "Webhook received and processed"} 