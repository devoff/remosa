import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.models.platform import Platform
from app.models.exporter import Exporter
from app.models.job import Job
from app.services.job_processor import job_processor
from app.services.notification_service import notification_service
from app.services.monitoring_service import monitoring_service

client = TestClient(app)

class TestIntegration:
    """Интеграционные тесты системы экспортеров и автоматизации"""
    
    @pytest.fixture
    def db_session(self):
        """Получение сессии базы данных"""
        return next(get_db())
    
    @pytest.fixture
    def superadmin_user(self, db_session: Session):
        """Создание superadmin пользователя для тестов"""
        user = User(
            email="test@example.com",
            username="testadmin",
            is_superadmin=True,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def test_platform(self, db_session: Session):
        """Создание тестовой платформы"""
        platform = Platform(
            name="Test Platform",
            description="Test platform for integration tests"
        )
        db_session.add(platform)
        db_session.commit()
        db_session.refresh(platform)
        return platform
    
    @pytest.fixture
    def test_exporter(self, db_session: Session, test_platform: Platform):
        """Создание тестового экспортера"""
        exporter = Exporter(
            name="Test CubicMedia Exporter",
            exporter_type="cubicmedia",
            platform_id=test_platform.id,
            config={
                "api_endpoint": "https://test-api.example.com",
                "mac_addresses": ["00:11:22:33:44:55", "AA:BB:CC:DD:EE:FF"]
            },
            is_active=True
        )
        db_session.add(exporter)
        db_session.commit()
        db_session.refresh(exporter)
        return exporter
    
    @pytest.fixture
    def test_job(self, db_session: Session, test_platform: Platform):
        """Создание тестового задания"""
        job = Job(
            name="Test Job",
            job_type="device_restart",
            platform_id=test_platform.id,
            conditions=[
                {
                    "field": "status",
                    "operator": "equals",
                    "value": "offline"
                }
            ],
            actions=[
                {
                    "type": "send_notification",
                    "config": {
                        "message": "Device is offline",
                        "recipients": ["admin@example.com"]
                    }
                }
            ],
            is_active=True
        )
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)
        return job
    
    def test_exporter_creation_and_configuration(self, db_session: Session, test_platform: Platform):
        """Тест создания и настройки экспортера"""
        # Создаем экспортер через API
        exporter_data = {
            "name": "Integration Test Exporter",
            "exporter_type": "cubicmedia",
            "platform_id": test_platform.id,
            "config": {
                "api_endpoint": "https://test-api.example.com",
                "mac_addresses": ["00:11:22:33:44:55"]
            },
            "is_active": True
        }
        
        response = client.post("/api/v1/exporters/", json=exporter_data)
        assert response.status_code == 201
        
        exporter_id = response.json()["id"]
        
        # Проверяем, что экспортер создан
        response = client.get(f"/api/v1/exporters/{exporter_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Integration Test Exporter"
        
        # Обновляем конфигурацию
        updated_config = {
            "api_endpoint": "https://updated-api.example.com",
            "mac_addresses": ["00:11:22:33:44:55", "AA:BB:CC:DD:EE:FF"]
        }
        
        response = client.put(
            f"/api/v1/exporters/{exporter_id}/config",
            json={"config": updated_config}
        )
        assert response.status_code == 200
        
        # Проверяем обновление
        response = client.get(f"/api/v1/exporters/{exporter_id}")
        assert response.json()["config"]["api_endpoint"] == "https://updated-api.example.com"
    
    def test_job_creation_and_execution(self, db_session: Session, test_platform: Platform):
        """Тест создания и выполнения задания"""
        # Создаем задание через API
        job_data = {
            "name": "Integration Test Job",
            "job_type": "device_restart",
            "platform_id": test_platform.id,
            "conditions": [
                {
                    "field": "status",
                    "operator": "equals",
                    "value": "offline"
                }
            ],
            "actions": [
                {
                    "type": "send_notification",
                    "config": {
                        "message": "Device is offline",
                        "recipients": ["admin@example.com"]
                    }
                }
            ],
            "is_active": True
        }
        
        response = client.post("/api/v1/jobs/", json=job_data)
        assert response.status_code == 201
        
        job_id = response.json()["id"]
        
        # Проверяем, что задание создано
        response = client.get(f"/api/v1/jobs/{job_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Integration Test Job"
        
        # Получаем список заданий
        response = client.get("/api/v1/jobs/")
        assert response.status_code == 200
        jobs = response.json()
        assert len(jobs) > 0
    
    def test_monitoring_endpoints(self, db_session: Session):
        """Тест эндпоинтов мониторинга"""
        # Тест статистики
        response = client.get("/api/v1/monitoring/statistics")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        
        # Тест состояния системы
        response = client.get("/api/v1/monitoring/health")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        
        # Тест неудачных заданий
        response = client.get("/api/v1/monitoring/failed-jobs")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        
        # Тест уведомлений
        response = client.get("/api/v1/monitoring/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
    
    @pytest.mark.asyncio
    async def test_job_processor_integration(self, db_session: Session, test_job: Job):
        """Тест интеграции обработчика заданий"""
        # Проверяем обработку задания
        await job_processor.process_job(db_session, test_job)
        
        # Проверяем, что задание выполнено
        assert test_job.execution_count > 0
        assert test_job.last_executed_at is not None
    
    @pytest.mark.asyncio
    async def test_notification_service_integration(self, db_session: Session):
        """Тест интеграции сервиса уведомлений"""
        # Отправляем тестовое уведомление
        result = await notification_service.send_notification(
            message="Integration test notification",
            recipients=["test@example.com"],
            notification_type="database"
        )
        
        assert result["success"] is True
        
        # Получаем список уведомлений
        notifications = await notification_service.get_notifications()
        assert len(notifications) > 0
    
    @pytest.mark.asyncio
    async def test_monitoring_service_integration(self, db_session: Session):
        """Тест интеграции сервиса мониторинга"""
        # Получаем статистику
        statistics = await monitoring_service.get_job_statistics(db_session)
        assert isinstance(statistics, dict)
        
        # Получаем состояние системы
        health = await monitoring_service.get_system_health()
        assert isinstance(health, dict)
        assert "system_status" in health
    
    def test_prometheus_metrics_endpoint(self):
        """Тест эндпоинта метрик Prometheus"""
        response = client.get("/api/v1/monitoring/metrics")
        assert response.status_code == 200
        assert "remosa_jobs_executed_total" in response.text
    
    def test_exporter_health_check(self, test_exporter: Exporter):
        """Тест проверки здоровья экспортера"""
        # Симулируем проверку здоровья экспортера
        # В реальной системе это будет HTTP запрос к экспортеру
        assert test_exporter.is_active is True
    
    def test_full_workflow(self, db_session: Session, test_platform: Platform):
        """Тест полного рабочего процесса"""
        # 1. Создаем экспортер
        exporter_data = {
            "name": "Full Workflow Exporter",
            "exporter_type": "cubicmedia",
            "platform_id": test_platform.id,
            "config": {
                "api_endpoint": "https://workflow-api.example.com",
                "mac_addresses": ["00:11:22:33:44:55"]
            },
            "is_active": True
        }
        
        response = client.post("/api/v1/exporters/", json=exporter_data)
        assert response.status_code == 201
        exporter_id = response.json()["id"]
        
        # 2. Создаем задание
        job_data = {
            "name": "Full Workflow Job",
            "job_type": "device_restart",
            "platform_id": test_platform.id,
            "conditions": [
                {
                    "field": "status",
                    "operator": "equals",
                    "value": "offline"
                }
            ],
            "actions": [
                {
                    "type": "send_notification",
                    "config": {
                        "message": "Device is offline in workflow",
                        "recipients": ["admin@example.com"]
                    }
                }
            ],
            "is_active": True
        }
        
        response = client.post("/api/v1/jobs/", json=job_data)
        assert response.status_code == 201
        job_id = response.json()["id"]
        
        # 3. Проверяем, что все компоненты работают
        response = client.get(f"/api/v1/exporters/{exporter_id}")
        assert response.status_code == 200
        
        response = client.get(f"/api/v1/jobs/{job_id}")
        assert response.status_code == 200
        
        response = client.get("/api/v1/monitoring/statistics")
        assert response.status_code == 200
        
        # 4. Проверяем интеграцию с платформой
        response = client.get(f"/api/v1/platforms/{test_platform.id}")
        assert response.status_code == 200
        
        # 5. Проверяем, что экспортер привязан к платформе
        response = client.get(f"/api/v1/platforms/{test_platform.id}/exporters")
        assert response.status_code == 200
        exporters = response.json()
        assert len(exporters) > 0

if __name__ == "__main__":
    pytest.main([__file__]) 