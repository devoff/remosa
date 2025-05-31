import aiohttp
from typing import Optional, List

class TelegramClient:
    def __init__(self, token: str):
        self.base_url = f"https://api.telegram.org/bot{token}"
    
    async def send_message(
        self,
        chat_id: str,
        text: str,
        parse_mode: Optional[str] = "HTML",
        reply_markup: Optional[dict] = None
    ) -> bool:
        """Отправка сообщения в Telegram"""
        async with aiohttp.ClientSession() as session:
            data = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            if reply_markup:
                data["reply_markup"] = reply_markup
                
            async with session.post(
                f"{self.base_url}/sendMessage",
                json=data
            ) as response:
                return response.status == 200
    
    async def send_broadcast(
        self,
        chat_ids: List[str],
        text: str,
        parse_mode: Optional[str] = "HTML"
    ) -> dict:
        """Отправка сообщения всем указанным получателям"""
        results = {}
        for chat_id in chat_ids:
            success = await self.send_message(chat_id, text, parse_mode)
            results[chat_id] = success
        return results 