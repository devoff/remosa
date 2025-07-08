import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.job import Job, JobExecution
from app.models.device import Device
from app.services.prometheus_service import prometheus_service
from app.services.device import DeviceService
from app.services.exporter_service import exporter_service

logger = logging.getLogger(__name__)


class PrometheusMonitoringService:
    """Сервис для мониторинга Prometheus метрик и выполнения заданий"""
    
    def __init__(self):
        self.is_running = False
        self.polling_interval = 30  # секунды между проверками
        self._task = None
    
    async def start_monitoring(self):
        """Запуск мониторинга"""
        if self.is_running:
            logger.warning("Мониторинг уже запущен")
            return
        
        self.is_running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        logger.info("Prometheus мониторинг запущен")
    
    async def stop_monitoring(self):
        """Остановка мониторинга"""
        if not self.is_running:
            return
        
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Prometheus мониторинг остановлен")
    
    async def _monitoring_loop(self):
        """Основной цикл мониторинга"""
        while self.is_running:
            try:
                await self._check_all_jobs()
                await asyncio.sleep(self.polling_interval)
            except Exception as e:
                logger.error(f"Ошибка в цикле мониторинга: {e}")
                await asyncio.sleep(5)  # Короткая пауза при ошибке
    
    async def _check_all_jobs(self):
        """Проверка всех активных заданий с Prometheus мониторингом"""
        db = next(get_db())
        try:
            # Получаем все активные задания с Prometheus мониторингом
            jobs = db.query(Job).filter(
                Job.is_active == True,
                Job.monitoring_device_mac.isnot(None),
                Job.monitoring_metric.isnot(None),
                Job.operator.isnot(None),
                Job.threshold_value.isnot(None)
            ).all()
            
            for job in jobs:
                await self._check_job_condition(job, db)
                
        except Exception as e:
            logger.error(f"Ошибка при проверке заданий: {e}")
        finally:
            db.close()
    
    async def _check_job_condition(self, job: Job, db: Session):
        """Проверка условия для конкретного задания"""
        try:
            # Получаем текущее значение метрики из Prometheus
            current_value = await self._get_prometheus_metric_value(
                job.monitoring_device_mac, 
                job.monitoring_metric,
                db
            )
            
            if current_value is None:
                logger.warning(f"Не удалось получить значение метрики {job.monitoring_metric} для устройства {job.monitoring_device_mac}")
                return
            
            # Проверяем условие
            condition_met = self._evaluate_condition(
                current_value, 
                job.operator, 
                job.threshold_value
            )
            
            # Обновляем последнее значение и время проверки
            job.last_prometheus_value = str(current_value)
            job.last_check_time = datetime.utcnow()
            db.commit()
            
            # Если условие выполнено и это новое срабатывание
            if condition_met and self._should_execute_job(job, current_value):
                await self._execute_job_action(job, current_value, db)
                
        except Exception as e:
            logger.error(f"Ошибка при проверке условия для задания {job.id}: {e}")
    
    async def _get_prometheus_metric_value(self, device_mac: str, metric_name: str, db: Session) -> Optional[float]:
        """Получение значения метрики из Prometheus"""
        try:
            # Используем существующий exporter_service для получения метрик
            # Находим экспортер по MAC адресу устройства
            exporters = exporter_service.get_all_exporters(db)
            
            for exporter in exporters:
                devices = prometheus_service.get_exporter_metrics(exporter.id)
                for device in devices:
                    if device.get('mac') == device_mac:
                        # Ищем нужную метрику в данных устройства
                        metrics = device.get('metrics', {})
                        if metric_name in metrics:
                            return float(metrics[metric_name])
            
            return None
            
        except Exception as e:
            logger.error(f"Ошибка при получении метрики {metric_name} для устройства {device_mac}: {e}")
            return None
    
    def _evaluate_condition(self, current_value: float, operator: str, threshold_value: str) -> bool:
        """Оценка условия сравнения"""
        try:
            threshold = float(threshold_value)
            
            if operator == '>':
                return current_value > threshold
            elif operator == '<':
                return current_value < threshold
            elif operator == '=':
                return current_value == threshold
            elif operator == '!=':
                return current_value != threshold
            elif operator == '>=':
                return current_value >= threshold
            elif operator == '<=':
                return current_value <= threshold
            else:
                logger.warning(f"Неизвестный оператор: {operator}")
                return False
                
        except (ValueError, TypeError) as e:
            logger.error(f"Ошибка при оценке условия: {e}")
            return False
    
    def _should_execute_job(self, job: Job, current_value: float) -> bool:
        """Проверка, нужно ли выполнять задание (избежание повторных срабатываний)"""
        if job.last_prometheus_value is None:
            return True
        
        try:
            last_value = float(job.last_prometheus_value)
            # Выполняем только если значение изменилось
            return abs(current_value - last_value) > 0.001
        except (ValueError, TypeError):
            return True
    
    async def _execute_job_action(self, job: Job, current_value: float, db: Session):
        """Выполнение действия задания"""
        try:
            # Создаем запись о выполнении
            execution = JobExecution(
                job_id=job.id,
                status="running",
                started_at=datetime.utcnow(),
                prometheus_value=str(current_value),
                condition_met=True,
                monitoring_device_mac=job.monitoring_device_mac,
                monitoring_metric=job.monitoring_metric
            )
            db.add(execution)
            db.commit()
            
            # Выполняем SMS команду если есть устройство
            if job.device_id:
                try:
                    device = db.query(Device).filter(Device.id == job.device_id).first()
                    if device and device.phone:
                        # Используем существующий DeviceService для отправки SMS
                        result = await DeviceService.send_sms_command(
                            device.phone, 
                            job.command, 
                            db
                        )
                        
                        execution.status = "completed"
                        execution.success = True
                        execution.completed_at = datetime.utcnow()
                        execution.output = f"SMS команда отправлена: {job.command}"
                        execution.duration = (execution.completed_at - execution.started_at).seconds
                        
                        logger.info(f"Задание {job.id} выполнено успешно: {job.command}")
                        
                    else:
                        execution.status = "failed"
                        execution.success = False
                        execution.completed_at = datetime.utcnow()
                        execution.error_message = "Устройство не найдено или не имеет номера телефона"
                        
                except Exception as e:
                    execution.status = "failed"
                    execution.success = False
                    execution.completed_at = datetime.utcnow()
                    execution.error_message = f"Ошибка выполнения SMS команды: {str(e)}"
                    logger.error(f"Ошибка выполнения задания {job.id}: {e}")
            else:
                execution.status = "completed"
                execution.success = True
                execution.completed_at = datetime.utcnow()
                execution.output = f"Условие выполнено: {job.monitoring_metric} {job.operator} {job.threshold_value}"
                execution.duration = (execution.completed_at - execution.started_at).seconds
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Ошибка при выполнении действия для задания {job.id}: {e}")
            if execution:
                execution.status = "failed"
                execution.success = False
                execution.completed_at = datetime.utcnow()
                execution.error_message = str(e)
                db.commit()


# Создаем глобальный экземпляр сервиса
prometheus_monitoring_service = PrometheusMonitoringService() 