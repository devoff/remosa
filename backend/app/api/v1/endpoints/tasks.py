from typing import Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.task_template import TaskTemplate, TaskActionType, TaskThresholdOperator
from app.models.task_execution import TaskExecution, TaskExecutionStatus
from app.models.platform import Platform
from app.models.user import User
from app.core.platform_permissions import require_platform_role
from app.core.audit import log_audit

router = APIRouter()

@router.get("/", response_model=List[dict], summary="Получить все шаблоны заданий",
            dependencies=[Depends(get_current_user)],
            tags=["Tasks"])
def read_task_templates(
    db: Session = Depends(get_db),
    platform_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список всех шаблонов заданий с возможностью фильтрации по платформе.
    """
    query = db.query(TaskTemplate)
    
    if platform_id:
        query = query.filter(TaskTemplate.platform_id == platform_id)
    
    task_templates = query.offset(skip).limit(limit).all()
    
    result = []
    for task in task_templates:
        result.append({
            "id": task.id,
            "name": task.name,
            "description": task.description,
            "platform_id": task.platform_id,
            "exporter_id": task.exporter_id,
            "prometheus_query": task.prometheus_query,
            "threshold_operator": task.threshold_operator.value,
            "threshold_value": task.threshold_value,
            "evaluation_window": task.evaluation_window,
            "action_type": task.action_type.value,
            "target_selector": task.target_selector,
            "command_template_id": task.command_template_id,
            "enabled": task.enabled,
            "cooldown_period": task.cooldown_period,
            "max_retries": task.max_retries,
            "retry_delay": task.retry_delay,
            "execution_count": task.execution_count,
            "last_execution": task.last_execution,
            "last_success": task.last_success,
            "created_at": task.created_at,
            "updated_at": task.updated_at
        })
    
    return result

@router.get("/{task_id}", response_model=dict, summary="Получить шаблон задания",
            dependencies=[Depends(get_current_user)],
            tags=["Tasks"])
def read_task_template(
    task_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить шаблон задания по ID.
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    return {
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "platform_id": task.platform_id,
        "exporter_id": task.exporter_id,
        "prometheus_query": task.prometheus_query,
        "threshold_operator": task.threshold_operator.value,
        "threshold_value": task.threshold_value,
        "evaluation_window": task.evaluation_window,
        "action_type": task.action_type.value,
        "target_selector": task.target_selector,
        "command_template_id": task.command_template_id,
        "enabled": task.enabled,
        "cooldown_period": task.cooldown_period,
        "max_retries": task.max_retries,
        "retry_delay": task.retry_delay,
        "execution_count": task.execution_count,
        "last_execution": task.last_execution,
        "last_success": task.last_success,
        "created_at": task.created_at,
        "updated_at": task.updated_at
    }

@router.post("/", response_model=dict, summary="Создать шаблон задания",
             dependencies=[Depends(get_current_user)],
             tags=["Tasks"])
def create_task_template(
    task_data: dict,  # {"name": str, "description": str, "platform_id": int, ...}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Создать новый шаблон задания для платформы.
    """
    # Проверяем, что платформа существует
    platform = db.query(Platform).filter(Platform.id == task_data["platform_id"]).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task_data["platform_id"], ["admin", "manager"])
    
    # Проверяем, что шаблон с таким именем не существует в платформе
    existing_task = db.query(TaskTemplate).filter(
        TaskTemplate.name == task_data["name"],
        TaskTemplate.platform_id == task_data["platform_id"]
    ).first()
    if existing_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Шаблон задания с таким именем уже существует в платформе"
        )
    
    # Создаем шаблон задания
    action_type = TaskActionType(task_data["action_type"])
    threshold_operator = TaskThresholdOperator(task_data["threshold_operator"])
    
    db_task = TaskTemplate(
        name=task_data["name"],
        description=task_data.get("description"),
        platform_id=task_data["platform_id"],
        exporter_id=task_data.get("exporter_id"),
        prometheus_query=task_data["prometheus_query"],
        threshold_operator=threshold_operator,
        threshold_value=task_data["threshold_value"],
        evaluation_window=task_data.get("evaluation_window", "5m"),
        action_type=action_type,
        target_selector=task_data.get("target_selector"),
        command_template_id=task_data.get("command_template_id"),
        enabled=task_data.get("enabled", True),
        cooldown_period=task_data.get("cooldown_period", "1h"),
        max_retries=task_data.get("max_retries", 3),
        retry_delay=task_data.get("retry_delay", "5m")
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    log_audit(db, action="create_task_template", user_id=current_user.id, 
              platform_id=task_data["platform_id"], 
              details=f"Создан шаблон задания: {db_task.name}")
    
    return {
        "id": db_task.id,
        "name": db_task.name,
        "action_type": db_task.action_type.value,
        "platform_id": db_task.platform_id,
        "message": "Шаблон задания создан успешно"
    }

@router.put("/{task_id}", response_model=dict, summary="Обновить шаблон задания",
            dependencies=[Depends(get_current_user)],
            tags=["Tasks"])
def update_task_template(
    task_id: int,
    task_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Обновить шаблон задания.
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task.platform_id, ["admin", "manager"])
    
    # Обновляем шаблон задания
    for field, value in task_update.items():
        if hasattr(task, field):
            setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    log_audit(db, action="update_task_template", user_id=current_user.id, 
              platform_id=task.platform_id, 
              details=f"Обновлен шаблон задания: {task.name}")
    
    return {
        "id": task.id,
        "name": task.name,
        "enabled": task.enabled,
        "message": "Шаблон задания обновлен успешно"
    }

@router.delete("/{task_id}", summary="Удалить шаблон задания",
               dependencies=[Depends(get_current_user)],
               tags=["Tasks"])
def delete_task_template(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Удалить шаблон задания.
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task.platform_id, ["admin"])
    
    # Удаляем шаблон задания
    db.delete(task)
    db.commit()
    
    log_audit(db, action="delete_task_template", user_id=current_user.id, 
              platform_id=task.platform_id, 
              details=f"Удален шаблон задания: {task.name}")
    
    return {"message": "Шаблон задания успешно удален"}

@router.post("/{task_id}/enable", summary="Включить шаблон задания",
             dependencies=[Depends(get_current_user)],
             tags=["Tasks"])
def enable_task_template(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Включить шаблон задания.
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task.platform_id, ["admin", "manager"])
    
    task.enabled = True
    db.commit()
    
    log_audit(db, action="enable_task_template", user_id=current_user.id, 
              platform_id=task.platform_id, 
              details=f"Включен шаблон задания: {task.name}")
    
    return {"message": "Шаблон задания включен успешно"}

@router.post("/{task_id}/disable", summary="Отключить шаблон задания",
             dependencies=[Depends(get_current_user)],
             tags=["Tasks"])
def disable_task_template(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Отключить шаблон задания.
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task.platform_id, ["admin", "manager"])
    
    task.enabled = False
    db.commit()
    
    log_audit(db, action="disable_task_template", user_id=current_user.id, 
              platform_id=task.platform_id, 
              details=f"Отключен шаблон задания: {task.name}")
    
    return {"message": "Шаблон задания отключен успешно"}

@router.get("/{task_id}/executions", response_model=List[dict], summary="Получить историю выполнения задания",
            dependencies=[Depends(get_current_user)],
            tags=["Tasks"])
def get_task_executions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    Получить историю выполнения задания.
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task.platform_id, ["admin", "manager", "user", "viewer"])
    
    executions = db.query(TaskExecution).filter(
        TaskExecution.task_template_id == task_id
    ).order_by(TaskExecution.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for execution in executions:
        result.append({
            "id": execution.id,
            "task_template_id": execution.task_template_id,
            "triggered_at": execution.triggered_at,
            "triggered_by_query": execution.triggered_by_query,
            "triggered_value": execution.triggered_value,
            "status": execution.status.value,
            "devices_affected": execution.devices_affected,
            "execution_result": execution.execution_result,
            "error_message": execution.error_message,
            "started_at": execution.started_at,
            "completed_at": execution.completed_at,
            "retry_count": execution.retry_count,
            "max_retries": execution.max_retries,
            "created_at": execution.created_at
        })
    
    return result

@router.post("/{task_id}/test", summary="Тестировать шаблон задания",
             dependencies=[Depends(get_current_user)],
             tags=["Tasks"])
def test_task_template(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Протестировать шаблон задания (выполнить один раз).
    """
    task = db.query(TaskTemplate).filter(TaskTemplate.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон задания не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, task.platform_id, ["admin", "manager"])
    
    # TODO: Здесь будет логика тестирования задания
    # Пока возвращаем заглушку
    return {
        "task_id": task.id,
        "name": task.name,
        "message": "Тестирование задания выполнено успешно",
        "result": {
            "devices_affected": [],
            "execution_time": "0.5s",
            "status": "completed"
        }
    }
