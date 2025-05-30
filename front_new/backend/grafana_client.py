from typing import List, Optional
import aiohttp
from datetime import datetime

class GrafanaClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def get_alerts(self) -> List[dict]:
        """Получение активных алертов из Grafana"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/api/alerts",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                return []
    
    async def get_alert_details(self, alert_id: str) -> Optional[dict]:
        """Получение детальной информации об алерте"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/api/alerts/{alert_id}",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return await response.json()
                return None