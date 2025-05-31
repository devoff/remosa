import aiohttp
from app.core.config import settings

class SMSGateway:
    def __init__(self):
        self.base_url = settings.SMS_GATEWAY_URL
        self.api_key = settings.SMS_GATEWAY_API_KEY

    async def send_command(self, phone_number: str, command: str) -> dict:
        """
        Отправляет команду на устройство через SMS-шлюз
        """
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "phone_number": phone_number,
                "message": command
            }
            
            async with session.post(
                f"{self.base_url}/send",
                json=payload,
                headers=headers
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"SMS Gateway error: {error_text}")
                
                return await response.json()

def get_sms_gateway() -> SMSGateway:
    return SMSGateway() 