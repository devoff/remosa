from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.services.command_service import CommandService
from app.schemas.command_template import CommandTemplateResponse
from app.core.database import get_db
from app.schemas.command_log import CommandLogResponse

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
    result = CommandService.build_command(db, template_id, params)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result

@router.post("/execute", response_model=CommandLogResponse)
async def execute_command(
    device_id: int = Body(...),
    template_id: int = Body(...),
    params: Dict[str, str] = Body(...),
    db: Session = Depends(get_db)
):
    """Выполнить команду и записать в лог"""
    # Генерируем команду
    command_data = CommandService.build_command(db, template_id, params)
    if not command_data:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Логируем
    log = CommandService.log_command(
        db,
        device_id=device_id,
        command=command_data["command"],
        status="sent",
        response="OK"
    )
    return log

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
