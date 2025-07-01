from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.platform import Platform
from app.schemas.platform import PlatformCreate, PlatformUpdate, PlatformResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[PlatformResponse])
def get_platforms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список всех платформ."""
    platforms = db.query(Platform).offset(skip).limit(limit).all()
    return platforms

@router.post("/", response_model=PlatformResponse)
def create_platform(
    platform: PlatformCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую платформу."""
    # Проверяем, что имя платформы уникально
    existing_platform = db.query(Platform).filter(Platform.name == platform.name).first()
    if existing_platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Платформа с таким именем уже существует"
        )
    
    db_platform = Platform(**platform.dict())
    db.add(db_platform)
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.get("/{platform_id}", response_model=PlatformResponse)
def get_platform(
    platform_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить платформу по ID."""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    return platform

@router.put("/{platform_id}", response_model=PlatformResponse)
def update_platform(
    platform_id: int,
    platform_update: PlatformUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить платформу."""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Проверяем уникальность имени, если оно изменяется
    if platform_update.name and platform_update.name != platform.name:
        existing_platform = db.query(Platform).filter(Platform.name == platform_update.name).first()
        if existing_platform:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Платформа с таким именем уже существует"
            )
    
    update_data = platform_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(platform, field, value)
    
    db.commit()
    db.refresh(platform)
    return platform

@router.delete("/{platform_id}")
def delete_platform(
    platform_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить платформу."""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    db.delete(platform)
    db.commit()
    return {"message": "Платформа успешно удалена"} 