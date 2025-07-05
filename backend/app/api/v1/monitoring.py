from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.monitoring_service import monitoring_service
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/statistics")
async def get_job_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение статистики по заданиям"""
    try:
        # Проверяем права доступа (только superadmin)
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        statistics = await monitoring_service.get_job_statistics(db)
        return {
            "success": True,
            "data": statistics
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении статистики: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении статистики: {str(e)}"
        )

@router.get("/health")
async def get_system_health(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение состояния системы"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        health = await monitoring_service.get_system_health()
        return {
            "success": True,
            "data": health
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении состояния системы: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении состояния системы: {str(e)}"
        )

@router.get("/jobs/{job_id}/history")
async def get_job_execution_history(
    job_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение истории выполнения задания"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        history = await monitoring_service.get_job_execution_history(job_id, limit)
        return {
            "success": True,
            "data": history
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении истории задания {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении истории задания: {str(e)}"
        )

@router.get("/jobs/{job_id}/performance")
async def get_job_performance(
    job_id: int,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение метрик производительности задания"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        performance = await monitoring_service.get_job_performance_metrics(job_id)
        return {
            "success": True,
            "data": performance
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении метрик производительности задания {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении метрик производительности: {str(e)}"
        )

@router.get("/failed-jobs")
async def get_failed_jobs(
    hours: int = 24,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение списка неудачных заданий"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        failed_jobs = await monitoring_service.get_failed_jobs(hours)
        return {
            "success": True,
            "data": failed_jobs
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении неудачных заданий: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении неудачных заданий: {str(e)}"
        )

@router.get("/notifications")
async def get_notifications(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение списка уведомлений"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        notifications = await notification_service.get_notifications(limit, offset)
        return {
            "success": True,
            "data": notifications
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении уведомлений: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении уведомлений: {str(e)}"
        )

@router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Отметить уведомление как прочитанное"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        success = await notification_service.mark_notification_as_read(notification_id)
        
        if success:
            return {
                "success": True,
                "message": "Уведомление отмечено как прочитанное"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Уведомление не найдено"
            )
        
    except Exception as e:
        logger.error(f"Ошибка при отметке уведомления как прочитанного: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при отметке уведомления: {str(e)}"
        )

@router.post("/cleanup")
async def cleanup_old_executions(
    days: int = 30,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Очистка старых записей выполнения"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        deleted_count = await monitoring_service.cleanup_old_executions(days)
        return {
            "success": True,
            "message": f"Удалено {deleted_count} старых записей",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        logger.error(f"Ошибка при очистке старых записей: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при очистке записей: {str(e)}"
        )

@router.get("/metrics")
async def get_prometheus_metrics(
    current_user: User = Depends(get_current_user)
) -> str:
    """Получение метрик Prometheus"""
    try:
        # Проверяем права доступа
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен. Требуются права superadmin."
            )
        
        metrics = await monitoring_service.get_prometheus_metrics()
        return metrics
        
    except Exception as e:
        logger.error(f"Ошибка при получении метрик Prometheus: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении метрик: {str(e)}"
        ) 