import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from prometheus_client import CollectorRegistry, Gauge, Counter
import httpx

from app.models.job import Job, JobExecution
from app.models.exporter import Exporter
from app.models.command_template import CommandTemplate
from app.core.database import get_db
from app.core.config import settings
from app.services.prometheus_service import PrometheusService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class JobProcessor:
    """Обработчик автоматических заданий"""
    
    def __init__(self):
        self.prometheus_service = PrometheusService()
        self.notification_service = NotificationService()
        
        # Метрики Prometheus
        self.registry = CollectorRegistry()
        self.jobs_executed = Counter(
            'remosa_jobs_executed_total',
            'Total number of jobs executed',
            ['job_id', 'job_type', 'status'],
            registry=self.registry
        )
        self.job_execution_duration = Gauge(
            'remosa_job_execution_duration_seconds',
            'Job execution duration in seconds',
            ['job_id', 'job_type'],
            registry=self.registry
        )
    
    async def process_jobs(self, db: Session) -> None:
        """Основной цикл обработки заданий"""
        try:
            # Получаем активные задания
            active_jobs = db.query(Job).filter(Job.is_active == True).all()
            
            for job in active_jobs:
                try:
                    await self.process_job(db, job)
                except Exception as e:
                    logger.error(f"Ошибка при обработке задания {job.id}: {e}")
                    await self.record_job_execution(db, job, success=False, error=str(e))
                    
        except Exception as e:
            logger.error(f"Ошибка в основном цикле обработки заданий: {e}")
    
    async def process_job(self, db: Session, job: Job) -> None:
        """Обработка одного задания"""
        start_time = datetime.utcnow()
        
        try:
            # Проверяем условия выполнения
            if not await self.check_job_conditions(db, job):
                logger.debug(f"Задание {job.id} не выполняется - условия не выполнены")
                return
            
            # Выполняем действия
            results = await self.execute_job_actions(db, job)
            
            # Записываем результат
            await self.record_job_execution(db, job, success=True, results=results)
            
            # Обновляем метрики
            duration = (datetime.utcnow() - start_time).total_seconds()
            self.job_execution_duration.labels(job_id=job.id, job_type=job.job_type).set(duration)
            self.jobs_executed.labels(job_id=job.id, job_type=job.job_type, status='success').inc()
            
            logger.info(f"Задание {job.id} выполнено успешно")
            
        except Exception as e:
            logger.error(f"Ошибка при выполнении задания {job.id}: {e}")
            await self.record_job_execution(db, job, success=False, error=str(e))
            self.jobs_executed.labels(job_id=job.id, job_type=job.job_type, status='error').inc()
    
    async def check_job_conditions(self, db: Session, job: Job) -> bool:
        """Проверка условий выполнения задания"""
        try:
            # Получаем текущие метрики из Prometheus
            metrics = await self.prometheus_service.get_current_metrics()
            
            for condition in job.conditions:
                if not await self.evaluate_condition(condition, metrics):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при проверке условий задания {job.id}: {e}")
            return False
    
    async def evaluate_condition(self, condition: Dict[str, Any], metrics: List[Dict[str, Any]]) -> bool:
        """Оценка одного условия"""
        field = condition.get('field')
        operator = condition.get('operator')
        value = condition.get('value')
        
        if not field or operator not in ['equals', 'not_equals', 'contains', 'greater_than', 'less_than']:
            return False
        
        # Ищем метрику с нужным полем
        for metric in metrics:
            if field in metric:
                metric_value = metric[field]
                
                if operator == 'equals':
                    return str(metric_value) == str(value)
                elif operator == 'not_equals':
                    return str(metric_value) != str(value)
                elif operator == 'contains':
                    return str(value) in str(metric_value)
                elif operator == 'greater_than':
                    try:
                        return float(metric_value) > float(value)
                    except (ValueError, TypeError):
                        return False
                elif operator == 'less_than':
                    try:
                        return float(metric_value) < float(value)
                    except (ValueError, TypeError):
                        return False
        
        return False
    
    async def execute_job_actions(self, db: Session, job: Job) -> List[Dict[str, Any]]:
        """Выполнение действий задания"""
        results = []
        
        for action in job.actions:
            try:
                result = await self.execute_action(db, job, action)
                results.append({
                    'action_type': action['type'],
                    'success': True,
                    'result': result
                })
            except Exception as e:
                logger.error(f"Ошибка при выполнении действия {action['type']}: {e}")
                results.append({
                    'action_type': action['type'],
                    'success': False,
                    'error': str(e)
                })
        
        return results
    
    async def execute_action(self, db: Session, job: Job, action: Dict[str, Any]) -> Any:
        """Выполнение одного действия"""
        action_type = action.get('type')
        config = action.get('config', {})
        
        if action_type == 'send_notification':
            return await self.send_notification(db, job, config)
        elif action_type == 'execute_command':
            return await self.execute_command(db, job, config)
        elif action_type == 'webhook':
            return await self.send_webhook(db, job, config)
        else:
            raise ValueError(f"Неизвестный тип действия: {action_type}")
    
    async def send_notification(self, db: Session, job: Job, config: Dict[str, Any]) -> Dict[str, Any]:
        """Отправка уведомления"""
        message = config.get('message', f'Задание {job.name} выполнено')
        recipients = config.get('recipients', [])
        
        # Отправляем уведомление через сервис уведомлений
        notification_result = await self.notification_service.send_notification(
            message=message,
            recipients=recipients,
            job_id=job.id
        )
        
        return {
            'message': message,
            'recipients': recipients,
            'notification_result': notification_result
        }
    
    async def execute_command(self, db: Session, job: Job, config: Dict[str, Any]) -> Dict[str, Any]:
        """Выполнение команды по шаблону"""
        command_template_id = config.get('command_template_id')
        
        if not command_template_id:
            raise ValueError("Не указан ID шаблона команды")
        
        # Получаем шаблон команды
        template = db.query(CommandTemplate).filter(CommandTemplate.id == command_template_id).first()
        if not template:
            raise ValueError(f"Шаблон команды {command_template_id} не найден")
        
        # Получаем устройства для выполнения команды
        devices = await self.get_devices_for_job(db, job)
        
        results = []
        for device in devices:
            try:
                # Выполняем команду на устройстве
                command_result = await self.execute_command_on_device(template, device)
                results.append({
                    'device': device,
                    'success': True,
                    'result': command_result
                })
            except Exception as e:
                results.append({
                    'device': device,
                    'success': False,
                    'error': str(e)
                })
        
        return {
            'template_id': command_template_id,
            'template_name': template.name,
            'devices_processed': len(devices),
            'results': results
        }
    
    async def send_webhook(self, db: Session, job: Job, config: Dict[str, Any]) -> Dict[str, Any]:
        """Отправка webhook"""
        webhook_url = config.get('webhook_url')
        
        if not webhook_url:
            raise ValueError("Не указан URL webhook")
        
        # Подготавливаем данные для webhook
        webhook_data = {
            'job_id': job.id,
            'job_name': job.name,
            'job_type': job.job_type,
            'timestamp': datetime.utcnow().isoformat(),
            'execution_count': job.execution_count + 1
        }
        
        # Отправляем webhook
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=webhook_data)
            response.raise_for_status()
        
        return {
            'webhook_url': webhook_url,
            'status_code': response.status_code,
            'response': response.text
        }
    
    async def get_devices_for_job(self, db: Session, job: Job) -> List[Dict[str, Any]]:
        """Получение устройств для выполнения задания"""
        # Получаем устройства из Prometheus по условиям задания
        devices = await self.prometheus_service.get_devices_by_conditions(job.conditions)
        return devices
    
    async def execute_command_on_device(self, template: CommandTemplate, device: Dict[str, Any]) -> Dict[str, Any]:
        """Выполнение команды на конкретном устройстве"""
        # Здесь должна быть логика выполнения команды на устройстве
        # Пока возвращаем заглушку
        return {
            'device_mac': device.get('mac_address'),
            'command': template.command,
            'status': 'executed',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def record_job_execution(self, db: Session, job: Job, success: bool, 
                                 results: Optional[List[Dict[str, Any]]] = None, 
                                 error: Optional[str] = None) -> None:
        """Запись результата выполнения задания"""
        execution = JobExecution(
            job_id=job.id,
            executed_at=datetime.utcnow(),
            success=success,
            results=results or [],
            error=error
        )
        
        db.add(execution)
        
        # Обновляем счетчик выполнений
        job.execution_count += 1
        job.last_executed_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Записано выполнение задания {job.id}: success={success}")
    
    async def start_processing_loop(self) -> None:
        """Запуск основного цикла обработки заданий"""
        logger.info("Запуск обработчика заданий")
        
        while True:
            try:
                db = next(get_db())
                await self.process_jobs(db)
                db.close()
                
                # Пауза между циклами
                await asyncio.sleep(settings.JOB_PROCESSOR_INTERVAL)
                
            except Exception as e:
                logger.error(f"Ошибка в цикле обработки заданий: {e}")
                await asyncio.sleep(60)  # Пауза при ошибке

# Глобальный экземпляр обработчика
job_processor = JobProcessor() 