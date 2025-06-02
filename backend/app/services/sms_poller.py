import re
import logging
import asyncio
import httpx
import json
from datetime import datetime

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.device import Device
from app.models.log import Log

logger = logging.getLogger(__name__)

async def poll_sms_gateway():
    db = SessionLocal()
    try:
        headers = {
            "Authorization": f"{settings.SMS_GATEWAY_API_KEY}"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.SMS_GATEWAY_URL}/sms", headers=headers)
            response.raise_for_status()
            
            # Теперь предполагаем, что шлюз возвращает JSON
            json_data = response.json()
            logger.info(f"Получен JSON ответ от SMS-шлюза:\n{json_data}")

        # Проверяем статус из JSON ответа, игнорируя регистр
        status_from_gateway = json_data.get("status", "").lower()
        if status_from_gateway == "no new sms" or not json_data.get("sms_messages"):
            logger.info("SMS-шлюз сообщает: Нет новых SMS или список пуст. Пропускаем парсинг.")
            return

        sms_messages = json_data.get("sms_messages", [])

        processed_sms_count = 0
        for sms_data in sms_messages:
            phone_number = sms_data.get("from")
            message_text = sms_data.get("message")
            timestamp = sms_data.get("timestamp") # Необязательное поле

            if phone_number and message_text:
                # Нормализуем номер телефона: удаляем символ '+'
                normalized_phone_number = phone_number.lstrip('+')
                device = db.query(Device).filter(Device.phone == normalized_phone_number).first()

                log_entry_message = f"Входящее SMS от {phone_number}: {message_text}"
                if timestamp:
                    log_entry_message = f"Входящее SMS от {phone_number} ({timestamp}): {message_text}"

                log_entry = Log(
                    device_id=device.id if device else None,
                    level="sms_in",
                    message=log_entry_message,
                    status="received" if device else "unmatched",
                    extra_data=sms_data # Сохраняем весь словарь SMS как Python-объект
                )
                db.add(log_entry)
                db.commit()

                if device:
                    logger.info(f"Сохранено входящее SMS от устройства {device.name} ({phone_number}): {message_text}")
                    processed_sms_count += 1
                else:
                    logger.warning(f"Устройство с номером {phone_number} не найдено для входящего SMS. Запись сохранена со статусом 'unmatched': {message_text}")
            else:
                logger.warning(f"Не удалось получить номер телефона или сообщение из SMS-блока: {sms_data}")
        
        logger.info(f"Обработано {processed_sms_count} новых SMS.")

    except httpx.RequestError as e:
        logger.error(f"Ошибка при запросе к SMS-шлюзу: {e}")
    except Exception as e:
        logger.error(f"Неизвестная ошибка в poll_sms_gateway: {e}", exc_info=True)
    finally:
        db.close()

# TODO: Интегрировать trigger_fast_polling в app.services.command_service.CommandService 
# или в app.api.v1.commands.execute_command после успешной отправки SMS. 