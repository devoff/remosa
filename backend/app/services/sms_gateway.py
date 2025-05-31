import aiohttp
from app.core.config import settings

class SMSGateway:
    def __init__(self):
        self.base_url = settings.SMS_GATEWAY_URL
        self.api_key = settings.SMS_GATEWAY_API_KEY # Теперь используется

    async def send_command(self, phone_number: str, command: str) -> dict:
        """
        Отправляет команду на устройство через SMS-шлюз
        """
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"{self.api_key}" # Теперь используется ключ как есть, без добавления "API"
            }
            params = {
                "number": phone_number,
                "text": command
            }
            
            async with session.post(
                f"{self.base_url}/send",
                params=params, # Передаем параметры в строке запроса
                headers=headers # Добавляем заголовки
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"SMS Gateway error: {response.status} - {error_text}")
                
                return await response.text() # Теперь возвращаем сырой текст

def get_sms_gateway() -> SMSGateway:
    return SMSGateway() 