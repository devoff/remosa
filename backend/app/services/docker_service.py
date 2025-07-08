import docker
import logging
from typing import Dict, List, Optional
from docker.errors import DockerException, NotFound

logger = logging.getLogger(__name__)

class DockerService:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except DockerException as e:
            logger.error(f"Ошибка подключения к Docker: {e}")
            self.client = None
    
    def get_container_status(self, container_name: str) -> str:
        """
        Получить статус Docker контейнера.
        
        Args:
            container_name: Имя контейнера
            
        Returns:
            str: Статус контейнера ('running', 'stopped', 'not_found', 'error')
        """
        if not self.client:
            return "error"
        
        try:
            container = self.client.containers.get(container_name)
            return container.status
        except NotFound:
            return "not_found"
        except Exception as e:
            logger.error(f"Ошибка получения статуса контейнера {container_name}: {e}")
            return "error"
    
    def get_exporter_status(self, exporter_type: str) -> str:
        """
        Получить статус экспортера по типу.
        
        Args:
            exporter_type: Тип экспортера ('cubic_media' или 'addreality')
            
        Returns:
            str: Статус контейнера ('running', 'stopped', 'not_found', 'error')
        """
        if not self.client:
            return "error"
        
        # Определяем имя контейнера по типу экспортера
        if exporter_type == "cubic_media":
            container_name = "remosa_cubic_exporter_1"
        elif exporter_type == "addreality":
            container_name = "remosa_addreality_exporter_1"
        else:
            return "error"
        
        try:
            container = self.client.containers.get(container_name)
            return container.status
        except NotFound:
            return "not_found"
        except Exception as e:
            logger.error(f"Ошибка получения статуса контейнера {container_name}: {e}")
            return "error"
    


# Создаем глобальный экземпляр сервиса
docker_service = DockerService() 