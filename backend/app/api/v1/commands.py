from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from app.services.command_service import CommandService
from app.schemas.command_template import CommandTemplateResponse, CommandParamSchema, CommandTemplateCreate
from app.core.database import get_db
from app.schemas.command_log import CommandLogResponse
from app.models import Log, CommandTemplate, Device
from app.services.sms_gateway import SMSGateway, get_sms_gateway
from app.core.auth import get_current_user
from app.models.user import User
import re
import logging
from datetime import datetime

router = APIRouter()

@router.get("/templates/", response_model=List[CommandTemplateResponse])
async def get_all_command_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все шаблоны команд"""
    templates = db.query(CommandTemplate).all()
    if not templates:
        raise HTTPException(status_code=404, detail="No command templates found")
    return templates

@router.get("/templates/{model}", response_model=List[CommandTemplateResponse])
async def get_command_templates(
    model: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить шаблоны команд для типа устройства"""
    templates = CommandService.get_templates(db, model)
    if not templates:
        raise HTTPException(status_code=404, detail="Templates not found")
    return templates

@router.post("/build")
async def build_command(
    template_id: int,
    params: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Сгенерировать команду с параметрами"""
    template = db.query(CommandTemplate).get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    validation_errors = CommandService.validate_params(params, template.params_schema)
    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid parameters", "errors": validation_errors}
        )
    
    result = CommandService.build_command(db, template_id, params)
    return result

@router.post("/execute", response_model=CommandLogResponse)
async def execute_command(
    device_id: int = Body(...),
    template_id: int = Body(...),
    params: Dict[str, str] = Body(...),
    db: Session = Depends(get_db),
    sms_gateway: SMSGateway = Depends(get_sms_gateway),
    current_user: User = Depends(get_current_user)
):
    """Выполнить команду и записать в лог"""
    template = db.query(CommandTemplate).get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    validation_errors = CommandService.validate_params(params, template.params_schema)
    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid parameters", "errors": validation_errors}
        )
    
    command_data = CommandService.build_command(db, template_id, params)
    
    # Получаем устройство
    device = db.query(Device).get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Отправляем команду через SMS, если у устройства указан телефон
    sms_response = None
    if device.phone:
        try:
            sms_response = await sms_gateway.send_command(
                phone_number=device.phone,
                command=command_data["command"]
            )
            log_status = "sent"
            log_level = "SMS_OUT"
            log_response = sms_response or "OK"
            
            # Логируем успешную отправку SMS в audit log
            from app.core.audit import log_audit
            log_audit(
                db=db,
                action="sms_command_sent",
                user_id=current_user.id,
                platform_id=device.platform_id,
                device_id=device_id,
                details=f"SMS command '{command_data['command']}' sent to device {device.name} ({device.phone})"
            )
        except Exception as e:
            log_status = "failed"
            log_level = "ERROR"
            log_response = f"Ошибка отправки SMS: {e}"
            # Логируем ошибку для детального анализа
            logger = logging.getLogger(__name__)
            logger.error(f"Ошибка при отправке SMS для устройства {device_id}: {e}", exc_info=True)
            
            # Логируем ошибку SMS Gateway в audit log для мониторинга платформы
            from app.core.audit import log_audit
            log_audit(
                db=db,
                action="sms_gateway_error",
                user_id=current_user.id,
                platform_id=device.platform_id,
                device_id=device_id,
                details=f"SMS Gateway error for device {device.name} ({device.phone}): {str(e)[:200]}"
            )
    else:
        log_status = "skipped"
        log_level = "info"
        log_response = "Устройство не имеет номера телефона"
    
    # Логируем
    log = CommandService.log_command(
        db,
        device_id=device_id,
        command=command_data["command"],
        status=log_status,
        response=log_response,
        level=log_level # Передаем явно уровень логирования
    )
    return log

@router.get("/status/{command_id}", response_model=CommandLogResponse)
async def get_command_status(
    command_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить статус выполнения команды"""
    log = db.query(Log).filter(Log.id == command_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Command log not found")
    return log

@router.post("/templates/", response_model=CommandTemplateResponse)
async def create_command_template(
    template: CommandTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый шаблон команды"""
    db_template = CommandTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/templates/{template_id}", response_model=CommandTemplateResponse)
async def update_command_template(
    template_id: int,
    template_update: CommandTemplateCreate, # Re-using create schema for simplicity, could be a specific update schema
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить существующий шаблон команды"""
    db_template = db.query(CommandTemplate).filter(CommandTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Command Template not found")
    
    update_data = template_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_template, field, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/templates/{template_id}", response_model=Dict[str, str])
async def delete_command_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить шаблон команды"""
    db_template = db.query(CommandTemplate).filter(CommandTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Command Template not found")
    
    db.delete(db_template)
    db.commit()
    return {"message": "Command Template deleted successfully"}
