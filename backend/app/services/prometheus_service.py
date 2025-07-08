import requests
import logging
from typing import Dict, List, Optional
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

import os
from app.core.config import settings

class PrometheusService:
    def __init__(self):
        # Получаем URL из настроек
        self.base_url = settings.PROMETHEUS_URL
        self.api_url = urljoin(self.base_url, "/api/v1/")
    
    def query_metrics(self, query: str) -> Optional[List[Dict]]:
        """
        Выполнить запрос к Prometheus API.
        
        Args:
            query: PromQL запрос
            
        Returns:
            List[Dict]: Результаты запроса или None
        """
        try:
            logger.info(f"Prometheus query: {query}")
            response = requests.get(
                f"{self.api_url}query",
                params={"query": query},
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if data["status"] == "success":
                return data["data"]["result"]
            else:
                logger.error(f"Ошибка запроса к Prometheus: {data}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка подключения к Prometheus: {e}")
            return None
        except Exception as e:
            logger.error(f"Ошибка обработки ответа Prometheus: {e}")
            return None
    
    def get_platform_devices(self, platform_id: int) -> List[Dict]:
        """
        Получить устройства конкретной платформы из Prometheus.
        
        Args:
            platform_id: ID платформы
            
        Returns:
            List[Dict]: Список устройств с метриками
        """
        # Запрос для получения статуса устройств платформы
        status_query = f'remosa_exporter_cubic_device_status{{platform_id="{platform_id}"}}'
        status_results = self.query_metrics(status_query) or []
        
        # Запрос для получения информации об устройствах
        info_query = f'remosa_exporter_cubic_device_info{{platform_id="{platform_id}"}}'
        info_results = self.query_metrics(info_query) or []
        
        # Создаем словарь с информацией об устройствах
        devices_info = {}
        for result in info_results:
            metric = result["metric"]
            mac = metric.get("mac", "unknown")
            devices_info[mac] = {
                "name": metric.get("name", "unknown"),
                "ip": metric.get("ip", "unknown"),
                "outip": metric.get("outip", "unknown"),
                "platform_id": metric.get("platform_id", str(platform_id)),
                "exporter_id": metric.get("exporter_id", "unknown")
            }
        
        # Объединяем статус и информацию
        devices = []
        for result in status_results:
            metric = result["metric"]
            mac = metric.get("mac", "unknown")
            status_value = result["value"][1]  # Значение метрики
            
            device = {
                "mac": mac,
                "status": int(float(status_value)),
                "status_text": "online" if int(float(status_value)) == 1 else "offline",
                "platform_id": metric.get("platform_id", str(platform_id)),
                "exporter_id": metric.get("exporter_id", "unknown")
            }
            
            # Добавляем информацию об устройстве
            if mac in devices_info:
                device.update(devices_info[mac])
            
            devices.append(device)
        
        return devices
    
    def get_exporter_metrics(self, exporter_id: int) -> List[Dict]:
        """
        Получить метрики конкретного экспортера.
        
        Args:
            exporter_id: ID экспортера
            
        Returns:
            List[Dict]: Список устройств экспортера
        """
        # Получаем все метрики статуса устройств
        status_query = 'remosa_exporter_cubic_device_status'
        status_results = self.query_metrics(status_query) or []
        
        # Получаем все метрики информации об устройствах
        info_query = 'remosa_exporter_cubic_device_info'
        info_results = self.query_metrics(info_query) or []
        
        # Фильтруем метрики по exporter_id в Python-коде
        exporter_id_str = str(exporter_id)
        status_results = [r for r in status_results if r.get("metric", {}).get("exporter_id") == exporter_id_str]
        info_results = [r for r in info_results if r.get("metric", {}).get("exporter_id") == exporter_id_str]
        
        # Создаем словарь с информацией об устройствах
        devices_info = {}
        for result in info_results:
            metric = result["metric"]
            mac = metric.get("mac", "unknown")
            devices_info[mac] = {
                "name": metric.get("name", "unknown"),
                "ip": metric.get("ip", "unknown"),
                "outip": metric.get("outip", "unknown"),
                "platform_id": metric.get("platform_id", "unknown"),
                "exporter_id": metric.get("exporter_id", str(exporter_id))
            }
        
        # Объединяем статус и информацию
        devices = []
        for result in status_results:
            metric = result["metric"]
            mac = metric.get("mac", "unknown")
            status_value = result["value"][1]  # Значение метрики
            
            device = {
                "mac": mac,
                "status": int(float(status_value)),
                "status_text": "online" if int(float(status_value)) == 1 else "offline",
                "platform_id": metric.get("platform_id", "unknown"),
                "exporter_id": metric.get("exporter_id", str(exporter_id))
            }
            
            # Добавляем информацию об устройстве
            if mac in devices_info:
                device.update(devices_info[mac])
            
            devices.append(device)
        
        return devices
    
    def get_platform_stats(self, platform_id: int) -> Dict:
        """
        Получить статистику платформы из Prometheus.
        
        Args:
            platform_id: ID платформы
            
        Returns:
            Dict: Статистика платформы
        """
        devices = self.get_platform_devices(platform_id)
        
        total_devices = len(devices)
        online_devices = sum(1 for device in devices if device.get("status") == 1)
        offline_devices = total_devices - online_devices
        
        return {
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": offline_devices,
            "online_percentage": (online_devices / total_devices * 100) if total_devices > 0 else 0
        }
    
    def get_exporter_stats(self, exporter_id: int) -> Dict:
        """
        Получить статистику экспортера из Prometheus.
        
        Args:
            exporter_id: ID экспортера
            
        Returns:
            Dict: Статистика экспортера
        """
        devices = self.get_exporter_metrics(exporter_id)
        
        total_devices = len(devices)
        online_devices = sum(1 for device in devices if device.get("status") == 1)
        offline_devices = total_devices - online_devices
        
        return {
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": offline_devices,
            "online_percentage": (online_devices / total_devices * 100) if total_devices > 0 else 0
        }
    
    def get_all_platforms_stats(self) -> Dict[int, Dict]:
        """
        Получить статистику всех платформ.
        
        Returns:
            Dict[int, Dict]: Статистика по платформам
        """
        # Запрос для получения всех платформ
        query = 'group by (platform_id) (remosa_exporter_cubic_device_status)'
        results = self.query_metrics(query) or []
        
        platforms_stats = {}
        for result in results:
            platform_id = int(result["metric"]["platform_id"])
            platforms_stats[platform_id] = self.get_platform_stats(platform_id)
        
        return platforms_stats
    
    def test_connection(self) -> bool:
        """
        Проверить подключение к Prometheus.
        
        Returns:
            bool: True если подключение успешно
        """
        try:
            response = requests.get(f"{self.api_url}query", params={"query": "up"}, timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_device_metrics_by_mac(self, mac: str) -> Dict:
        """
        Получить все метрики устройства по MAC из Prometheus.
        Args:
            mac: MAC-адрес устройства
        Returns:
            Dict: {имя_метрики: значение}
        """
        result = {}
        # Запрашиваем конкретную метрику статуса устройства
        query = f'remosa_exporter_cubic_device_status{{mac="{mac}"}}'
        logger.info(f"Prometheus query for device metrics: {query}")
        metrics = self.query_metrics(query) or []
        
        # Логируем все найденные метрики и их MAC
        for m in metrics:
            metric_name = m['metric']['__name__']
            value = m['value'][1]
            mac_val = m['metric'].get('mac', 'NO_MAC')
            logger.info(f"[DEBUG] Prometheus metric: {metric_name}, mac: {mac_val}, value: {value}")
            # Используем читаемое имя для метрики статуса
            if metric_name == 'remosa_exporter_cubic_device_status':
                result['device_status'] = value
            else:
                result[metric_name] = value
        
        # Дополнительно логируем, если ничего не найдено
        if not result:
            logger.warning(f"[DEBUG] Для MAC {mac} не найдено ни одной метрики в Prometheus!")
        else:
            logger.info(f"[DEBUG] Найдены метрики для MAC {mac}: {result}")
        return result

    def get_addreality_devices(self, platform_id: int = None, exporter_id: int = None) -> List[Dict]:
        """
        Получить устройства AddRealityExporter из Prometheus по platform_id или exporter_id.
        """
        # Метрики AddReality
        connection_query = 'remosa_exporter_addreality_connection_state'
        info_query = 'remosa_exporter_addreality_device_info'

        connection_results = self.query_metrics(connection_query) or []
        info_results = self.query_metrics(info_query) or []

        # Фильтрация по platform_id или exporter_id
        def filter_metric(metric):
            if platform_id is not None:
                return metric.get('platform_id') == str(platform_id)
            if exporter_id is not None:
                return metric.get('exporter_id') == str(exporter_id)
            return True

        # Словарь device_id -> info
        devices_info = {}
        for result in info_results:
            metric = result['metric']
            if not filter_metric(metric):
                continue
            device_id = metric.get('device_id', 'unknown')
            devices_info[device_id] = {
                'name': metric.get('name', 'unknown'),
                'player_version': metric.get('player_version', ''),
                'time_zone': metric.get('time_zone', ''),
                'activation_state': metric.get('activation_state', ''),
                'platform_id': metric.get('platform_id', str(platform_id) if platform_id else ''),
                'exporter_id': metric.get('exporter_id', str(exporter_id) if exporter_id else ''),
            }

        devices = []
        for result in connection_results:
            metric = result['metric']
            if not filter_metric(metric):
                continue
            device_id = metric.get('device_id', 'unknown')
            status_value = result['value'][1]
            device = {
                'mac': device_id,  # для совместимости с фронтом
                'device_id': device_id,
                'status': int(float(status_value)),
                'status_text': 'online' if int(float(status_value)) == 1 else 'offline',
                'platform_id': metric.get('platform_id', str(platform_id) if platform_id else ''),
                'exporter_id': metric.get('exporter_id', str(exporter_id) if exporter_id else ''),
            }
            if device_id in devices_info:
                device.update(devices_info[device_id])
            devices.append(device)
        return devices

# Создаем глобальный экземпляр сервиса
prometheus_service = PrometheusService()
