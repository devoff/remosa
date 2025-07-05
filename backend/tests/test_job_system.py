import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.job import Job, JobExecution
from app.models.platform import Platform
from app.services.job_processor import JobProcessor
from app.services.notification_service import NotificationService
from app.services.monitoring_service import MonitoringService

class TestJobProcessor:
    """Тесты для обработчика заданий"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        self.processor = JobProcessor()
    
    @pytest.mark.asyncio
    async def test_job_conditions_evaluation(self):
        """Тест оценки условий задания"""
        # Тестовые метрики
        metrics = [
            {"status": "offline", "device_id": "device1"},
            {"status": "online", "device_id": "device2"}
        ]
        
        # Условие: статус равен offline
        condition = {
            "field": "status",
            "operator": "equals",
            "value": "offline"
        }
        
        result = await self.processor.evaluate_condition(condition, metrics)
        assert result is True
        
        # Условие: статус не равен online
        condition = {
            "field": "status",
            "operator": "not_equals",
            "value": "online"
        }
        
        result = await self.processor.evaluate_condition(condition, metrics)
        assert result is True
    
    @pytest.mark.asyncio
    async def test_job_action_execution(self):
        """Тест выполнения действий задания"""
        # Мокаем сервисы
        with patch.object(self.processor, 'notification_service') as mock_notification:
            mock_notification.send_notification = AsyncMock(return_value={"success": True})
            
            action = {
                "type": "send_notification",
                "config": {
                    "message": "Test notification",
                    "recipients": ["test@example.com"]
                }
            }
            
            result = await self.processor.execute_action(None, None, action)
            
            assert result["message"] == "Test notification"
            assert result["recipients"] == ["test@example.com"]
    
    @pytest.mark.asyncio
    async def test_command_execution(self):
        """Тест выполнения команд"""
        # Мокаем базу данных и шаблон команды
        mock_db = Mock()
        mock_template = Mock()
        mock_template.id = 1
        mock_template.name = "Test Template"
        mock_template.command = "reboot"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_template
        
        action = {
            "type": "execute_command",
            "config": {
                "command_template_id": 1
            }
        }
        
        with patch.object(self.processor, 'get_devices_for_job') as mock_devices:
            mock_devices.return_value = [
                {"mac_address": "00:11:22:33:44:55"}
            ]
            
            result = await self.processor.execute_command(mock_db, None, action)
            
            assert result["template_id"] == 1
            assert result["template_name"] == "Test Template"
            assert result["devices_processed"] == 1
    
    @pytest.mark.asyncio
    async def test_webhook_execution(self):
        """Тест выполнения webhook"""
        action = {
            "type": "webhook",
            "config": {
                "webhook_url": "https://test-webhook.com"
            }
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = "OK"
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            result = await self.processor.send_webhook(None, None, action["config"])
            
            assert result["webhook_url"] == "https://test-webhook.com"
            assert result["status_code"] == 200

class TestNotificationService:
    """Тесты для сервиса уведомлений"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        self.service = NotificationService()
    
    @pytest.mark.asyncio
    async def test_send_database_notification(self):
        """Тест отправки уведомления в базу данных"""
        with patch('app.services.notification_service.get_db') as mock_get_db:
            mock_db = Mock()
            mock_notification = Mock()
            mock_notification.id = 1
            mock_db.add.return_value = None
            mock_db.commit.return_value = None
            mock_db.refresh.return_value = None
            mock_get_db.return_value = iter([mock_db])
            
            result = await self.service.save_database_notification(
                message="Test message",
                recipients=["test@example.com"]
            )
            
            assert result["success"] is True
            assert result["method"] == "database"
    
    @pytest.mark.asyncio
    async def test_send_email_notification(self):
        """Тест отправки email уведомления"""
        result = await self.service.send_email_notification(
            message="Test email",
            recipients=["test@example.com"]
        )
        
        assert result["success"] is True
        assert result["method"] == "email"
    
    @pytest.mark.asyncio
    async def test_send_webhook_notification(self):
        """Тест отправки webhook уведомления"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = "OK"
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            result = await self.service.send_webhook_notification(
                message="Test webhook",
                recipients=["test@example.com"]
            )
            
            assert result["success"] is True
            assert result["method"] == "webhook"
    
    @pytest.mark.asyncio
    async def test_get_notifications(self):
        """Тест получения списка уведомлений"""
        with patch('app.services.notification_service.get_db') as mock_get_db:
            mock_db = Mock()
            mock_notification = Mock()
            mock_notification.id = 1
            mock_notification.message = "Test message"
            mock_notification.recipients = ["test@example.com"]
            mock_notification.status = "sent"
            mock_notification.created_at = datetime.utcnow()
            mock_notification.job_id = None
            
            mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_notification]
            mock_get_db.return_value = iter([mock_db])
            
            notifications = await self.service.get_notifications()
            
            assert len(notifications) == 1
            assert notifications[0]["message"] == "Test message"

class TestMonitoringService:
    """Тесты для сервиса мониторинга"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        self.service = MonitoringService()
    
    @pytest.mark.asyncio
    async def test_get_job_statistics(self):
        """Тест получения статистики заданий"""
        with patch('app.services.monitoring_service.get_db') as mock_get_db:
            mock_db = Mock()
            
            # Мокаем запросы к базе данных
            mock_db.query.return_value.count.return_value = 10
            mock_db.query.return_value.filter.return_value.count.return_value = 5
            mock_db.query.return_value.filter.return_value.all.return_value = [
                Mock(success=True),
                Mock(success=True),
                Mock(success=False)
            ]
            
            mock_get_db.return_value = iter([mock_db])
            
            statistics = await self.service.get_job_statistics(mock_db)
            
            assert "total_jobs" in statistics
            assert "active_jobs" in statistics
            assert "success_rate" in statistics
    
    @pytest.mark.asyncio
    async def test_get_system_health(self):
        """Тест получения состояния системы"""
        with patch('app.services.monitoring_service.get_db') as mock_get_db:
            mock_db = Mock()
            
            # Мокаем запросы
            mock_db.query.return_value.count.return_value = 10
            mock_db.query.return_value.filter.return_value.count.return_value = 5
            
            mock_get_db.return_value = iter([mock_db])
            
            health = await self.service.get_system_health()
            
            assert "jobs" in health
            assert "notifications" in health
            assert "system_status" in health
    
    @pytest.mark.asyncio
    async def test_cleanup_old_executions(self):
        """Тест очистки старых записей"""
        with patch('app.services.monitoring_service.get_db') as mock_get_db:
            mock_db = Mock()
            mock_db.query.return_value.filter.return_value.delete.return_value = 5
            
            mock_get_db.return_value = iter([mock_db])
            
            deleted_count = await self.service.cleanup_old_executions(days=30)
            
            assert deleted_count == 5

class TestJobSystemIntegration:
    """Интеграционные тесты системы заданий"""
    
    @pytest.mark.asyncio
    async def test_full_job_workflow(self):
        """Тест полного рабочего процесса задания"""
        # Создаем тестовые данные
        job = Job(
            name="Integration Test Job",
            job_type="device_restart",
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
        
        # Мокаем сервисы
        processor = JobProcessor()
        
        with patch.object(processor, 'check_job_conditions') as mock_conditions:
            mock_conditions.return_value = True
            
            with patch.object(processor, 'execute_job_actions') as mock_actions:
                mock_actions.return_value = [{"success": True}]
                
                with patch.object(processor, 'record_job_execution') as mock_record:
                    await processor.process_job(None, job)
                    
                    # Проверяем, что методы вызваны
                    mock_conditions.assert_called_once()
                    mock_actions.assert_called_once()
                    mock_record.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_notification_workflow(self):
        """Тест рабочего процесса уведомлений"""
        service = NotificationService()
        
        # Тест отправки уведомления
        with patch.object(service, 'save_database_notification') as mock_save:
            mock_save.return_value = {"success": True}
            
            result = await service.send_notification(
                message="Test notification",
                recipients=["test@example.com"],
                notification_type="database"
            )
            
            assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_monitoring_workflow(self):
        """Тест рабочего процесса мониторинга"""
        service = MonitoringService()
        
        # Тест получения статистики
        with patch.object(service, 'get_job_statistics') as mock_stats:
            mock_stats.return_value = {
                "total_jobs": 10,
                "active_jobs": 5,
                "success_rate": 80.0
            }
            
            statistics = await service.get_job_statistics(None)
            
            assert statistics["total_jobs"] == 10
            assert statistics["success_rate"] == 80.0

if __name__ == "__main__":
    pytest.main([__file__]) 