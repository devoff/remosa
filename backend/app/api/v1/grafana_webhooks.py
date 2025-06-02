import json
import logging
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import ValidationError
from datetime import datetime, timezone

from app.core.database import get_db
from app.schemas.grafana import GrafanaWebhookPayload
from app.models.alert import Alert
from app.models.device import Device
from app.models.command_template import CommandTemplate
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.sms_gateway import SMSGateway

router = APIRouter()
sms_gateway = SMSGateway() # Создаем экземпляр SMSGateway

# Настраиваем логгер
logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.INFO) # Удаляем тестовую настройку логирования

@router.post("/grafana-webhook/")
async def grafana_webhook(payload: GrafanaWebhookPayload, db: Session = Depends(get_db)):
    logger.info(f"Получен вебхук Grafana. Полезная нагрузка: {payload.model_dump_json(indent=2)}")

    for alert_data in payload.alerts:
        alert_name = alert_data.labels.alertname
        alert_status = alert_data.status
        player_name = alert_data.labels.player_name or "Неизвестный плеер"
        player_id_str = alert_data.labels.player_id
        platform = alert_data.labels.platform or "Неизвестная платформа"
        summary = payload.commonAnnotations.summary if payload.commonAnnotations and payload.commonAnnotations.summary else "Нет описания"
        starts_at_str = alert_data.startsAt
        ends_at_str = alert_data.endsAt
        severity = alert_data.labels.severity or "info"

        def truncate_microseconds(dt_str: str) -> str:
            if not dt_str:
                return dt_str
            match = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d{1,6})?(\d*)([+-]\d{2}:\d{2}|Z)$", dt_str)
            if match:
                base = match.group(1)
                microseconds = match.group(2) or ".000000"
                tz_info = match.group(4)
                return f"{base}{microseconds[:7]}{tz_info}"
            return dt_str

        processed_starts_at = truncate_microseconds(starts_at_str)
        processed_ends_at = truncate_microseconds(ends_at_str)
        logger.info(f"DEBUG_STARTSAT: Processed startsAt: {processed_starts_at}") # Добавляем логирование для отладки

        device_id_for_alert = None
        device_phone_number = None
        if player_id_str:
            device = db.query(Device).filter(Device.grafana_uid == player_id_str).first()
            if device:
                device_id_for_alert = device.id
                device_phone_number = device.phone
                logger.info(f"Найден device_id: {device_id_for_alert} для grafana_uid: {player_id_str}")
            else:
                logger.warning(f"Устройство с grafana_uid {player_id_str} не найдено.")
        else:
            logger.info("player_id отсутствует в алерте Grafana.")

        # Подготовка данных для создания/обновления алерта
        alert_message = f"🚨 АЛЕРТ: {alert_name} ({alert_status.upper()})\n\nПлеер: {player_name} ({player_id_str or 'N/A'})\nПлатформа: {platform}\nОписание: {summary}"
        alert_data_dict = {
            "alert_name": alert_name,
            "player_name": player_name,
            "player_id": player_id_str,
            "platform": platform,
            "summary": summary,
            "startsAt": processed_starts_at,
            "endsAt": processed_ends_at,
            "severity": severity,
            "grafana_folder": alert_data.labels.grafana_folder,
            "instance": alert_data.labels.instance,
            "job": alert_data.labels.job,
            "alert_type": alert_data.labels.alert_type or "generic",
            "device_id": device_id_for_alert,
            "device_phone_number": device_phone_number,
            "fingerprint": alert_data.fingerprint,
            "status": alert_status, # Добавляем статус алерта в details
            "message": alert_message # Добавляем сгенерированное сообщение в details
        }

        # Логика для resolved алертов: найти и обновить существующий firing алерт
        if alert_status.lower() == "resolved":
            existing_firing_alert = db.query(Alert).filter(
                Alert.alert_name == alert_name,
                Alert.status == "firing",
                Alert.device_id == device_id_for_alert, # Используем device_id
                Alert.grafana_player_id == player_id_str
            ).order_by(Alert.created_at.desc()).first()

            if existing_firing_alert:
                logger.info(f"Найден активный алерт (ID: {existing_firing_alert.id}) для разрешения. Обновляю статус и endsAt.")
                existing_firing_alert.status = alert_status
                existing_firing_alert.resolved_at = datetime.fromisoformat(processed_ends_at.replace("Z", "+00:00"))
                db.add(existing_firing_alert)
                db.commit()
                db.refresh(existing_firing_alert)
                logger.info(f"Успешно обновлен алерт с id: {existing_firing_alert.id}")
                continue

        # Проверяем, существует ли уже алерт с таким external_id (fingerprint) И alert_name
        existing_alert = db.query(Alert).filter(
            Alert.external_id == alert_data.fingerprint,
            Alert.alert_name == alert_name # Добавляем проверку по alert_name
        ).first()

        if existing_alert:
            # Если алерт существует, обновляем его статус и updated_at
            logger.info(f"Алерт с external_id {alert_data.fingerprint} уже существует. Обновляю статус с {existing_alert.status} на {alert_status}.")
            existing_alert.status = alert_status
            existing_alert.updated_at = datetime.now(timezone.utc)
            existing_alert.severity = severity # Обновляем severity, так как он мог измениться
            db.add(existing_alert)
            db.commit()
            db.refresh(existing_alert)
            logger.info(f"Успешно обновлен существующий алерт с id: {existing_alert.id}")
            continue # Переходим к следующему алерту в полезной нагрузке

        # Если это firing алерт, или resolved алерт без соответствующего firing, создаем новый алерт
        try:
            alert_title = payload.title if payload.title else alert_data.labels.alertname
            if not alert_title:
                alert_title = "Generated Alert Title" # Запасной вариант, если title все еще None
            logger.info(f"DEBUG_ALERT_TITLE: Title before DB add: {alert_title}") # Добавляем логирование для отладки

            db_alert = Alert(
                device_id=device_id_for_alert,
                alert_name=alert_name,
                alert_type=alert_data.labels.alert_type or "generic",
                message=alert_message,
                data=alert_data_dict,
                severity=severity,
                status=alert_status,
                grafana_player_id=player_id_str,
                created_at=datetime.fromisoformat(processed_starts_at.replace("Z", "+00:00")),
                source="Grafana",
                title=alert_title,  # Используем определенный alert_title
                timestamp=datetime.fromisoformat(processed_starts_at.replace("Z", "+00:00")),
                external_id=alert_data.fingerprint,
                details=alert_data_dict,
            )
            db.add(db_alert)
            db.commit()
            db.refresh(db_alert)
            logger.info(f"Успешно добавлен новый алерт с id: {db_alert.id}")

            # Отправка SMS-уведомления, если есть номер телефона, алерт firing, и включена отправка SMS по шаблону
            if device and device.phone and alert_status.lower() == "firing" and device.send_alert_sms:
                sms_command_text = ""
                if device.alert_sms_template_id:
                    command_template = db.query(CommandTemplate).filter(CommandTemplate.id == device.alert_sms_template_id).first()
                    if command_template:
                        try:
                            # Форматируем шаблон, используя доступные данные алерта
                            sms_command_text = command_template.template.format(
                                alert_name=alert_name,
                                alert_status=alert_status.upper(),
                                player_name=player_name,
                                player_id_str=player_id_str or 'N/A',
                                platform=platform,
                                summary=summary
                            )
                        except KeyError as e:
                            logger.error(f"Ошибка форматирования шаблона SMS (неизвестный ключ {e}): {command_template.template}")
                            sms_command_text = f"АЛЕРТ! {alert_name}: {summary}" # Запасной вариант
                    else:
                        logger.warning(f"Шаблон команды с ID {device.alert_sms_template_id} не найден для устройства {device.name}. Использую стандартное сообщение.")
                        sms_command_text = f"АЛЕРТ! {alert_name}: {summary}"
                else:
                    logger.info(f"Для устройства {device.name} включена отправка SMS, но шаблон не выбран. Использую стандартное сообщение.")
                    sms_command_text = f"АЛЕРТ! {alert_name}: {summary}"

                # Если sms_command_text все еще пуст (например, если device не найден, но phone_number есть), используем стандартное сообщение
                if not sms_command_text:
                    sms_command_text = f"АЛЕРТ! {alert_name}: {summary}"

                try:
                    await sms_gateway.send_command(device.phone, sms_command_text)
                    db_alert.response = f"SMS отправлено: {sms_command_text}"
                    db_alert.status = "firing_sms_sent" # Обновляем статус алерта после отправки SMS
                    db.add(db_alert)
                    db.commit()
                    db.refresh(db_alert)
                    logger.info(f"SMS-уведомление отправлено для алерта ID {db_alert.id}")
                except Exception as sms_e:
                    db_alert.response = f"Ошибка отправки SMS: {str(sms_e)}"
                    db_alert.status = "firing_sms_failed" # Обновляем статус алерта при ошибке отправки SMS
                    db.add(db_alert)
                    db.commit()
                    db.refresh(db_alert)
                    logger.error(f"Ошибка отправки SMS для алерта ID {db_alert.id}: {sms_e}", exc_info=True)

        except ValidationError as e:
            logger.error(f"Ошибка валидации Pydantic при создании/обновлении алерта: {e.errors()}")
            raise HTTPException(status_code=422, detail=e.errors())
        except Exception as e:
            logger.error(f"Ошибка при сохранении/обновлении алерта в БД: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при сохранении алерта.")

    return {"status": "success", "message": "Webhook received and processed"}

@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert_manually(alert_id: int, db: Session = Depends(get_db)):
    logger.info(f"Получен запрос на разрешение алерта с ID: {alert_id}")
    db_alert = db.query(Alert).filter(Alert.id == alert_id, Alert.status == "firing").first()

    if not db_alert:
        raise HTTPException(status_code=404, detail="Активный алерт не найден или уже разрешен")

    db_alert.status = "resolved"
    db_alert.updated_at = datetime.now(timezone.utc)
    
    try:
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        logger.info(f"Алерт с ID {alert_id} успешно переведен в статус 'resolved'.")
        return {"status": "success", "message": f"Алерт {alert_id} успешно разрешен"}
    except Exception as e:
        logger.error(f"Ошибка при разрешении алерта с ID {alert_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при разрешении алерта.") 