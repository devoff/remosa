from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.models.job import Job, JobExecution
from app.models.user import User
from app.models.device import Device
from app.core.auth import get_current_user
from app.core.platform_permissions import require_platform_role
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobExecutionResponse
from app.core.audit import log_audit
from app.services.prometheus_service import prometheus_service
from app.services.device import DeviceService
from app.services.exporter_service import exporter_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/devices-prometheus", response_model=List[dict])
async def get_prometheus_devices(
    platform_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить устройства для мониторинга из Prometheus"""
    try:
        devices = []
        # Если супер-админ — можно собрать устройства по всем платформам
        if current_user.is_superadmin:
            # Если platform_id явно указан — только по нему
            if platform_id:
                devices = prometheus_service.get_platform_devices(platform_id)
            else:
                # Получить все уникальные platform_id из Prometheus (или из БД)
                # Для простоты — попробуем взять из БД
                platform_ids = [row[0] for row in db.execute(text('SELECT id FROM platforms')).fetchall()]
                for pid in platform_ids:
                    devices.extend(prometheus_service.get_platform_devices(pid))
        else:
            # Для обычного пользователя — только по его платформам
            user_platforms = [p.platform_id for p in current_user.platforms]
            if platform_id and platform_id in user_platforms:
                devices = prometheus_service.get_platform_devices(platform_id)
            else:
                for pid in user_platforms:
                    devices.extend(prometheus_service.get_platform_devices(pid))
        # Формируем display_name
        for device in devices:
            device['display_name'] = f"{device.get('name', 'Unknown')} - {device.get('mac', 'No MAC')}"
        return devices
    except Exception as e:
        logger.error(f"Error getting Prometheus devices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Prometheus devices"
        )


@router.get("/devices-management", response_model=List[dict])
async def get_management_devices(
    platform_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить устройства для управления (SMS команды)"""
    try:
        if current_user.is_superadmin:
            query = db.query(Device)
        else:
            query = db.query(Device)
            user_platforms = [p.platform_id for p in current_user.platforms]
            if not user_platforms:
                return []
            query = query.filter(Device.platform_id.in_(user_platforms))
        devices = query.all()
        logger.warning(f"[DEBUG devices-management] user_id={current_user.id} is_superadmin={current_user.is_superadmin} user_platforms={[p.platform_id for p in current_user.platforms]} devices={[{'id': d.id, 'name': d.name, 'platform_id': d.platform_id, 'phone': d.phone} for d in devices]}")
        result = []
        for device in devices:
            result.append({
                "id": device.id,
                "name": device.name,
                "phone": device.phone,
                "platform_id": device.platform_id,
                "model": device.model,
                "display_name": f"{device.name} - {device.phone or 'No phone'}"
            })
        return result
        
    except Exception as e:
        logger.error(f"Error getting management devices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get management devices"
        )


@router.get("/prometheus/metrics/{device_mac}")
async def get_device_metrics(
    device_mac: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить актуальные метрики устройства из Prometheus"""
    try:
        # Получаем список платформ для пользователя
        if current_user.is_superadmin:
            platform_ids = [row[0] for row in db.execute(text('SELECT id FROM platforms')).fetchall()]
        else:
            platform_ids = [p.platform_id for p in current_user.platforms]
        
        for platform_id in platform_ids:
            try:
                devices = prometheus_service.get_platform_devices(platform_id)
                for device in devices:
                    if device.get('mac') == device_mac:
                        require_platform_role(current_user, platform_id, ["admin", "manager", "user", "viewer"], db)
                        # Получаем реальные метрики устройства по MAC
                        metrics = prometheus_service.get_device_metrics_by_mac(device_mac)
                        return {
                            "device_mac": device_mac,
                            "platform_id": platform_id,
                            "metrics": metrics,
                            "status": device.get('status', 0),
                            "status_text": device.get('status_text', 'unknown')
                        }
            except Exception as e:
                logger.warning(f"Ошибка получения метрик для платформы {platform_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found in Prometheus"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting device metrics for {device_mac}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get device metrics"
        )


@router.post("/generate-name")
async def generate_job_name(
    device_mac: str,
    metric_name: str,
    operator: str,
    threshold_value: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Сгенерировать автоматическое имя для задания"""
    try:
        # Получаем информацию об устройстве
        exporters = exporter_service.get_all_exporters(db)
        device_name = "Unknown Device"
        for exporter in exporters:
            try:
                devices = prometheus_service.get_exporter_metrics(exporter.id)
                for device in devices:
                    if device.get('mac') == device_mac:
                        device_name = device.get('name', 'Unknown Device')
                        break
                if device_name != "Unknown Device":
                    break
            except Exception as e:
                logger.warning(f"Ошибка поиска устройства {device_mac}: {e}")
        # Генерируем имя по шаблону
        job_name = f"Мониторинг {device_name} - {metric_name} {operator} {threshold_value}"
        # Проверяем уникальность имени
        existing_job = db.query(Job).filter(Job.name == job_name).first()
        if existing_job:
            counter = 1
            while True:
                new_name = f"{job_name} ({counter})"
                if not db.query(Job).filter(Job.name == new_name).first():
                    job_name = new_name
                    break
                counter += 1
        return {"name": job_name}
    except Exception as e:
        logger.error(f"Error generating job name: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate job name"
        )


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
            retry_delay=job_data.retry_delay,
            # Prometheus monitoring fields
            monitoring_device_mac=job_data.monitoring_device_mac,
            monitoring_metric=job_data.monitoring_metric,
            operator=job_data.operator,
            threshold_value=job_data.threshold_value,
            last_prometheus_value=job_data.last_prometheus_value,
            last_check_time=job_data.last_check_time,
            conditions=job_data.conditions,
            actions=job_data.actions
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
            user_platforms = [p.platform_id for p in current_user.platforms]
            if not user_platforms:
                logger.warning(f"[DEBUG jobs] user_id={current_user.id} нет платформ, возвращаю пусто")
                return []
            query = query.filter(Job.platform_id.in_(user_platforms))
        # Дополнительные фильтры
        if device_id:
            query = query.filter(Job.device_id == device_id)
        if is_active is not None:
            query = query.filter(Job.is_active == is_active)
        jobs = query.offset(skip).limit(limit).all()
        logger.warning(f"[DEBUG jobs] user_id={current_user.id} user_platforms={user_platforms} platform_id={platform_id} is_active={is_active} jobs={[job.id for job in jobs]}")
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