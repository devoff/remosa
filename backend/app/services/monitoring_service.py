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
            "remosa_job_success_rate",
            "Job execution success rate",
            ["job_id", "job_name"],
            registry=self.registry
        )
        
        self.job_execution_duration = Histogram(
            "remosa_job_execution_duration_seconds",
            "Job execution duration in seconds",
            ["job_id", "job_name"],
            registry=self.registry
        )
        
        self.active_jobs_count = Gauge(
            "remosa_active_jobs_total",
            "Total number of active jobs",
            registry=self.registry
        )
        
        self.failed_jobs_count = Gauge(
            "remosa_failed_jobs_total",
            "Total number of failed jobs in last hour",
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
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "recent_executions": len(recent_executions),
                "successful_executions": successful_executions,
                "failed_executions": failed_executions,
                "success_rate": round(success_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении статистики заданий: {e}")
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
                Notification.status == "sent"
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
                "jobs": {
                    "total": total_jobs,
                    "active": active_jobs,
                    "recent_executions": recent_executions,
                    "recent_failures": failed_recent
                },
                "notifications": {
                    "total": total_notifications,
                    "unread": unread_notifications
                },
                "system_status": "healthy" if failed_recent == 0 else "warning"
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении состояния системы: {e}")
            return {
                "system_status": "error",
                "error": str(e)
            }

# Глобальный экземпляр сервиса
monitoring_service = MonitoringService()
