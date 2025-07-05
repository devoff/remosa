from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.job import Job, JobExecution
from app.models.user import User
from app.core.auth import get_current_user
from app.core.platform_permissions import require_platform_role
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobExecutionResponse
from app.core.audit import log_audit
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новое задание"""
    try:
        # Проверяем права доступа к платформе
        require_platform_role(current_user, job_data.platform_id, ["admin", "manager"], db)
        
        # Создаем новое задание
        job = Job(
            name=job_data.name,
            description=job_data.description,
            command=job_data.command,
            platform_id=job_data.platform_id,
            device_id=job_data.device_id,
            is_active=job_data.is_active,
            schedule=job_data.schedule,
            timeout=job_data.timeout,
            retry_count=job_data.retry_count,
            retry_delay=job_data.retry_delay
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Логируем действие
        log_audit(
            db=db,
            action="job_created",
            user_id=current_user.id,
            platform_id=job.platform_id,
            details=f"Created job: {job.name}"
        )
        
        return JobResponse.from_orm(job)
        
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job"
        )


@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    platform_id: Optional[int] = None,
    device_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список заданий с фильтрацией"""
    try:
        query = db.query(Job)
        
        # Фильтрация по платформе
        if platform_id:
            require_platform_role(current_user, platform_id, ["admin", "manager", "user", "viewer"], db)
            query = query.filter(Job.platform_id == platform_id)
        else:
            # Если платформа не указана, показываем только задания для платформ пользователя
            user_platforms = [p.id for p in current_user.platforms]
            if not user_platforms:
                return []
            query = query.filter(Job.platform_id.in_(user_platforms))
        
        # Дополнительные фильтры
        if device_id:
            query = query.filter(Job.device_id == device_id)
        if is_active is not None:
            query = query.filter(Job.is_active == is_active)
        
        jobs = query.offset(skip).limit(limit).all()
        return [JobResponse.from_orm(job) for job in jobs]
        
    except Exception as e:
        logger.error(f"Error getting jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get jobs"
        )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить задание по ID"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Проверяем права доступа
        require_platform_role(current_user, job.platform_id, ["admin", "manager", "user", "viewer"], db)
        
        return JobResponse.from_orm(job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job"
        )


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить задание"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Проверяем права доступа
        require_platform_role(current_user, job.platform_id, ["admin", "manager"], db)
        
        # Обновляем поля
        update_data = job_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)
        
        job.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
        
        # Логируем действие
        log_audit(
            db=db,
            action="job_updated",
            user_id=current_user.id,
            platform_id=job.platform_id,
            details=f"Updated job: {job.name}"
        )
        
        return JobResponse.from_orm(job)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job"
        )


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить задание"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Проверяем права доступа
        require_platform_role(current_user, job.platform_id, ["admin"], db)
        
        job_name = job.name
        db.delete(job)
        db.commit()
        
        # Логируем действие
        log_audit(
            db=db,
            action="job_deleted",
            user_id=current_user.id,
            platform_id=job.platform_id,
            details=f"Deleted job: {job_name}"
        )
        
        return {"message": "Job deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete job"
        )


@router.get("/{job_id}/executions", response_model=List[JobExecutionResponse])
async def get_job_executions(
    job_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить историю выполнения задания"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Проверяем права доступа
        require_platform_role(current_user, job.platform_id, ["admin", "manager", "user", "viewer"], db)
        
        executions = db.query(JobExecution).filter(
            JobExecution.job_id == job_id
        ).order_by(JobExecution.created_at.desc()).offset(skip).limit(limit).all()
        
        return [JobExecutionResponse.from_orm(execution) for execution in executions]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job executions for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job executions"
        )


@router.post("/{job_id}/execute")
async def execute_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Запустить выполнение задания вручную"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Проверяем права доступа
        require_platform_role(current_user, job.platform_id, ["admin", "manager"], db)
        
        if not job.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot execute inactive job"
            )
        
        # Создаем новое выполнение
        execution = JobExecution(
            job_id=job_id,
            status="pending",
            created_at=datetime.utcnow()
        )
        
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        # Логируем действие
        log_audit(
            db=db,
            action="job_execution_triggered",
            user_id=current_user.id,
            platform_id=job.platform_id,
            details=f"Manually triggered execution for job: {job.name}"
        )
        
        # TODO: Здесь должна быть логика запуска выполнения задания
        # Пока просто возвращаем успех
        
        return {
            "message": "Job execution triggered",
            "execution_id": execution.id,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute job"
        ) 