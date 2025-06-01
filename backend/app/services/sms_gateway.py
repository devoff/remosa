import aiohttp
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class SMSGateway:
    def __init__(self):
        self.base_url = settings.SMS_GATEWAY_URL
        self.api_key = settings.SMS_GATEWAY_API_KEY # Теперь используется

    async def send_command(self, phone_number: str, command: str) -> dict:
        """
        Отправляет команду на устройство через SMS-шлюз
        """
        # Убедимся, что номер телефона начинается с '+ ', если он не начинается
        if not phone_number.startswith('+'):
            phone_number = '+' + phone_number

        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"{self.api_key}" # Теперь используется ключ как есть, без добавления "API"
            }
            params = {
                "number": phone_number,
                "text": command
            }

            # Логируем полный URL, параметры и заголовки перед отправкой
            full_url = f"{self.base_url}/send"
            logger.info(f"Отправка SMS-команды на URL: {full_url}")
            logger.info(f"Параметры: {params}")
            logger.info(f"Заголовки: {headers}")
            
            async with session.post(
                f"{self.base_url}/send", # Устанавливаем правильный эндпоинт для отправки SMS
                params=params, # Передаем параметры в строке запроса
                headers=headers # Добавляем заголовки
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"SMS Gateway returned error status {response.status}: {error_text}")
                    raise Exception("Ошибка работы SMS-шлюза. Подробности в логах бэкенда.")
                
                return await response.text() # Теперь возвращаем сырой текст

def get_sms_gateway() -> SMSGateway:
    return SMSGateway() 