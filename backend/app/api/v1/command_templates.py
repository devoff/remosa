from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.command_template import CommandTemplate
from app.models.device import Device
from app.schemas.command_template import CommandTemplateCreate, CommandTemplateResponse
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[CommandTemplateResponse])
def get_command_templates(
    skip: int = 0,
    limit: int = 100,
    model: Optional[str] = Query(None, description="Фильтр по модели устройства"),
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    subcategory: Optional[str] = Query(None, description="Фильтр по подкатегории"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список шаблонов команд."""
    query = db.query(CommandTemplate)
    
    if model:
        query = query.filter(CommandTemplate.model == model)
    if category:
        query = query.filter(CommandTemplate.category == category)
    if subcategory:
        query = query.filter(CommandTemplate.subcategory == subcategory)
    
    templates = query.offset(skip).limit(limit).all()
    return templates


@router.get("/categories", response_model=List[str])
def get_command_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список категорий команд."""
    categories = db.query(CommandTemplate.category).distinct().all()
    return [cat[0] for cat in categories]


@router.get("/subcategories", response_model=List[str])
def get_command_subcategories(
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список подкатегорий команд."""
    query = db.query(CommandTemplate.subcategory).filter(CommandTemplate.subcategory.isnot(None))
    if category:
        query = query.filter(CommandTemplate.category == category)
    subcategories = query.distinct().all()
    return [subcat[0] for subcat in subcategories]


@router.get("/by-device/{device_id}", response_model=List[CommandTemplateResponse])
def get_device_command_templates(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить шаблоны команд для конкретного устройства."""
    # Получаем устройство
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Устройство не найдено"
        )
    
    # Получаем шаблоны команд для модели устройства
    templates = db.query(CommandTemplate).filter(
        CommandTemplate.model == device.model
    ).all()
    
    return templates

@router.get("/{template_id}", response_model=CommandTemplateResponse)
def get_command_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить шаблон команды по ID."""
    template = db.query(CommandTemplate).filter(CommandTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон команды не найден"
        )
    return template

@router.post("/", response_model=CommandTemplateResponse)
def create_command_template(
    template: CommandTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый шаблон команды."""
    db_template = CommandTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/{template_id}", response_model=CommandTemplateResponse)
def update_command_template(
    template_id: int,
    template_update: CommandTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить шаблон команды."""
    template = db.query(CommandTemplate).filter(CommandTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон команды не найден"
        )
    
    update_data = template_update.dict()
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template

@router.delete("/{template_id}")
def delete_command_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить шаблон команды."""
    template = db.query(CommandTemplate).filter(CommandTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон команды не найден"
        )
    
    db.delete(template)
    db.commit()
    return {"message": "Шаблон команды успешно удален"} 