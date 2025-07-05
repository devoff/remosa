import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from prometheus_client import CollectorRegistry, Gauge, Counter, Histogram

from app.models.job import Job, JobExecution
from app.models.notification import Notification
from app.core.database import get_db

logger = logging.getLogger(__name__)

class MonitoringService:
    """Сервис для мониторинга выполнения заданий"""
    
    def __init__(self):
        self.registry = CollectorRegistry()
        
        # Метрики Prometheus
        self.job_execution_success_rate = Gauge(
            'remosa_job_success_rate',
            'Job execution success rate',
            ['job_id', 'job_name'],
            registry=self.registry
        )
        
        self.job_execution_duration = Histogram(
            'remosa_job_execution_duration_seconds',
            'Job execution duration in seconds',
            ['job_id', 'job_name'],
            registry=self.registry
        )
        
        self.active_jobs_count = Gauge(
            'remosa_active_jobs_total',
            'Total number of active jobs',
            registry=self.registry
        )
        
        self.failed_jobs_count = Gauge(
            'remosa_failed_jobs_total',
            'Total number of failed jobs in last hour',
            registry=self.registry
        )
    
    async def get_job_statistics(self, db: Session) -> Dict[str, Any]:
        """Получение статистики по заданиям"""
        try:
            # Общее количество заданий
            total_jobs = db.query(Job).count()
            active_jobs = db.query(Job).filter(Job.is_active == True).count()
            
            # Статистика выполнения за последние 24 часа
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_executions = db.query(JobExecution).filter(
                JobExecution.executed_at >= yesterday
            ).all()
            
            successful_executions = len([e for e in recent_executions if e.success])
            failed_executions = len([e for e in recent_executions if not e.success])
            
            success_rate = (successful_executions / len(recent_executions) * 100) if recent_executions else 0
            
            # Обновляем метрики
            self.active_jobs_count.set(active_jobs)
            self.failed_jobs_count.set(failed_executions)
            
            return {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'recent_executions': len(recent_executions),
                'successful_executions': successful_executions,
                'failed_executions': failed_executions,
                'success_rate': round(success_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении статистики заданий: {e}")
            return {}
    
    async def get_job_execution_history(self, job_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Получение истории выполнения задания"""
        try:
            db = next(get_db())
            executions = db.query(JobExecution).filter(
                JobExecution.job_id == job_id
            ).order_by(desc(JobExecution.executed_at)).limit(limit).all()
            
            result = []
            for execution in executions:
                result.append({
                    'id': execution.id,
                    'executed_at': execution.executed_at.isoformat() if execution.executed_at else None,
                    'success': execution.success,
                    'results': execution.results,
                    'error': execution.error
                })
            
            db.close()
            return result
            
        except Exception as e:
            logger.error(f"Ошибка при получении истории выполнения задания {job_id}: {e}")
            return []
    
    async def get_failed_jobs(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Получение списка неудачных заданий"""
        try:
            db = next(get_db())
            since = datetime.utcnow() - timedelta(hours=hours)
            
            failed_executions = db.query(JobExecution).filter(
                JobExecution.success == False,
                JobExecution.executed_at >= since
            ).order_by(desc(JobExecution.executed_at)).all()
            
            result = []
            for execution in failed_executions:
                job = db.query(Job).filter(Job.id == execution.job_id).first()
                result.append({
                    'job_id': execution.job_id,
                    'job_name': job.name if job else 'Unknown',
                    'executed_at': execution.executed_at.isoformat() if execution.executed_at else None,
                    'error': execution.error,
                    'results': execution.results
                })
            
            db.close()
            return result
            
        except Exception as e:
            logger.error(f"Ошибка при получении неудачных заданий: {e}")
            return []
    
    async def get_job_performance_metrics(self, job_id: int) -> Dict[str, Any]:
        """Получение метрик производительности задания"""
        try:
            db = next(get_db())
            
            # Получаем все выполнения задания
            executions = db.query(JobExecution).filter(
                JobExecution.job_id == job_id
            ).all()
            
            if not executions:
                db.close()
                return {}
            
            # Вычисляем метрики
            total_executions = len(executions)
            successful_executions = len([e for e in executions if e.success])
            failed_executions = total_executions - successful_executions
            
            success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0
            
            # Среднее время выполнения (если есть данные)
            execution_times = []
            for execution in executions:
                if execution.executed_at:
                    # Примерное время выполнения (можно улучшить)
                    execution_times.append(1.0)  # Заглушка
            
            avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
            
            # Обновляем Prometheus метрики
            self.job_execution_success_rate.labels(job_id=job_id, job_name=f"job_{job_id}").set(success_rate)
            
            db.close()
            
            return {
                'total_executions': total_executions,
                'successful_executions': successful_executions,
                'failed_executions': failed_executions,
                'success_rate': round(success_rate, 2),
                'avg_execution_time': round(avg_execution_time, 2)
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении метрик производительности задания {job_id}: {e}")
            return {}
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Получение общего состояния системы"""
        try:
            db = next(get_db())
            
            # Статистика по заданиям
            total_jobs = db.query(Job).count()
            active_jobs = db.query(Job).filter(Job.is_active == True).count()
            
            # Статистика по уведомлениям
            total_notifications = db.query(Notification).count()
            unread_notifications = db.query(Notification).filter(
                Notification.status == 'sent'
            ).count()
            
            # Статистика выполнения за последний час
            last_hour = datetime.utcnow() - timedelta(hours=1)
            recent_executions = db.query(JobExecution).filter(
                JobExecution.executed_at >= last_hour
            ).count()
            
            failed_recent = db.query(JobExecution).filter(
                JobExecution.success == False,
                JobExecution.executed_at >= last_hour
            ).count()
            
            db.close()
            
            return {
                'jobs': {
                    'total': total_jobs,
                    'active': active_jobs,
                    'recent_executions': recent_executions,
                    'recent_failures': failed_recent
                },
                'notifications': {
                    'total': total_notifications,
                    'unread': unread_notifications
                },
                'system_status': 'healthy' if failed_recent == 0 else 'warning'
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении состояния системы: {e}")
            return {
                'system_status': 'error',
                'error': str(e)
            }
    
    async def cleanup_old_executions(self, days: int = 30) -> int:
        """Очистка старых записей выполнения"""
        try:
            db = next(get_db())
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Удаляем старые записи выполнения
            deleted_count = db.query(JobExecution).filter(
                JobExecution.executed_at < cutoff_date
            ).delete()
            
            db.commit()
            db.close()
            
            logger.info(f"Удалено {deleted_count} старых записей выполнения заданий")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Ошибка при очистке старых записей: {e}")
            return 0
    
    async def get_prometheus_metrics(self) -> str:
        """Получение метрик Prometheus"""
        try:
            from prometheus_client import generate_latest
            return generate_latest(self.registry)
        except Exception as e:
            logger.error(f"Ошибка при генерации метрик Prometheus: {e}")
            return ""

# Глобальный экземпляр сервиса
monitoring_service = MonitoringService() 