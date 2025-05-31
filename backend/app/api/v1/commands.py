from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.services.command_service import CommandService
from app.schemas.command_template import CommandTemplateResponse, CommandParamSchema
from app.core.database import get_db
from app.schemas.command_log import CommandLogResponse
from app.models import Log, CommandTemplate, Device
from app.services.sms_gateway import SMSGateway, get_sms_gateway
import re

router = APIRouter()

@router.get("/templates/{model}", response_model=List[CommandTemplateResponse])
async def get_command_templates(
    model: str,
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    sms_gateway: SMSGateway = Depends(get_sms_gateway)
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
        sms_response = await sms_gateway.send_command(
            phone_number=device.phone,
            command=command_data["command"]
        )
    
    # Логируем
    log = CommandService.log_command(
        db,
        device_id=device_id,
        command=command_data["command"],
        status="sent",
        response=sms_response or "OK",
        # metadata={"sms_response": sms_response} if sms_response else None
    )
    return log

@router.get("/logs", response_model=List[CommandLogResponse])
async def get_all_command_logs(
    db: Session = Depends(get_db)
):
    """Получить всю историю команд"""
    logs = CommandService.get_all_command_logs(db)
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found")
    return logs

@router.get("/logs/{device_id}", response_model=List[CommandLogResponse])
async def get_command_logs(
    device_id: int,
    db: Session = Depends(get_db)
):
    """Получить историю команд для устройства"""
    logs = CommandService.get_command_logs(db, device_id)
    if not logs:
        raise HTTPException(status_code=404, detail="Logs not found")
    return logs

@router.get("/status/{command_id}", response_model=CommandLogResponse)
async def get_command_status(
    command_id: int,
    db: Session = Depends(get_db)
):
    """Получить статус выполнения команды"""
    log = db.query(Log).filter(Log.id == command_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Command log not found")
    return log
