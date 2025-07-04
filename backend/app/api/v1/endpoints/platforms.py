from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.platform import Platform
from app.schemas.platform import PlatformResponse, PlatformCreate, PlatformUpdate

router = APIRouter()

@router.get("/", response_model=List[PlatformResponse], summary="Получить все платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def read_platforms(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список всех платформ.
    """
    platforms = db.query(Platform).offset(skip).limit(limit).all()
    return platforms

@router.get("/{platform_id}", response_model=PlatformResponse, summary="Получить платформу",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def read_platform(
    platform_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить платформу по ID.
    """
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    return platform

@router.post("/", response_model=PlatformResponse, summary="Создать платформу",
             dependencies=[Depends(get_current_user)],
             tags=["Platforms"])
def create_platform(
    platform: PlatformCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Создать новую платформу.
    """
    # Проверяем, что платформа с таким именем не существует
    existing_platform = db.query(Platform).filter(Platform.name == platform.name).first()
    if existing_platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Платформа с таким именем уже существует"
        )
    
    db_platform = Platform(
        name=platform.name,
        description=platform.description,
        devices_limit=platform.devices_limit,
        sms_limit=platform.sms_limit
    )
    db.add(db_platform)
    db.commit()
    db.refresh(db_platform)
    return db_platform

@router.put("/{platform_id}", response_model=PlatformResponse, summary="Обновить платформу",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def update_platform(
    platform_id: int,
    platform_update: PlatformUpdate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Обновить платформу.
    """
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
    
    # Обновляем только переданные поля
    update_data = platform_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(platform, field, value)
    
    db.commit()
    db.refresh(platform)
    return platform

@router.delete("/{platform_id}", summary="Удалить платформу",
               dependencies=[Depends(get_current_user)],
               tags=["Platforms"])
def delete_platform(
    platform_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Удалить платформу.
    """
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Проверяем, что у платформы нет связанных устройств
    if platform.devices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить платформу с привязанными устройствами"
        )
    
    db.delete(platform)
    db.commit()
    return {"message": "Платформа успешно удалена"}

# Дополнительные endpoints для работы с пользователями платформ

@router.get("/{platform_id}/users", summary="Получить пользователей платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def get_platform_users(
    platform_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить список пользователей платформы.
    """
    from app.models.platform_user import PlatformUser
    from app.models.user import User
    
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Получаем пользователей с их ролями в платформе
    platform_users = db.query(PlatformUser, User).join(User).filter(
        PlatformUser.platform_id == platform_id
    ).all()
    
    result = []
    for platform_user, user in platform_users:
        result.append({
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "platform_role": platform_user.role,
            "created_at": platform_user.created_at
        })
    
    return result

@router.post("/{platform_id}/users", summary="Добавить пользователя в платформу",
             dependencies=[Depends(get_current_user)],
             tags=["Platforms"])
def add_user_to_platform(
    platform_id: int,
    user_data: dict,  # {"user_id": int, "role": str}
    db: Session = Depends(get_db),
) -> Any:
    """
    Добавить пользователя в платформу с определенной ролью.
    """
    from app.models.platform_user import PlatformUser
    from app.models.user import User
    
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    user = db.query(User).filter(User.id == user_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Проверяем, что пользователь еще не добавлен в платформу
    existing = db.query(PlatformUser).filter(
        PlatformUser.platform_id == platform_id,
        PlatformUser.user_id == user_data["user_id"]
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь уже добавлен в платформу"
        )
    
    platform_user = PlatformUser(
        platform_id=platform_id,
        user_id=user_data["user_id"],
        role=user_data.get("role", "user")
    )
    
    db.add(platform_user)
    db.commit()
    
    return {"message": "Пользователь добавлен в платформу"}

@router.put("/{platform_id}/users/{user_id}", summary="Обновить роль пользователя в платформе",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def update_platform_user_role(
    platform_id: int,
    user_id: int,
    role_data: dict,  # {"role": str}
    db: Session = Depends(get_db),
) -> Any:
    """
    Обновить роль пользователя в платформе.
    """
    from app.models.platform_user import PlatformUser
    
    platform_user = db.query(PlatformUser).filter(
        PlatformUser.platform_id == platform_id,
        PlatformUser.user_id == user_id
    ).first()
    
    if not platform_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в платформе"
        )
    
    platform_user.role = role_data["role"]
    db.commit()
    
    return {"message": "Роль пользователя обновлена"}

@router.delete("/{platform_id}/users/{user_id}", summary="Удалить пользователя из платформы",
               dependencies=[Depends(get_current_user)],
               tags=["Platforms"])
def remove_user_from_platform(
    platform_id: int,
    user_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Удалить пользователя из платформы.
    """
    from app.models.platform_user import PlatformUser
    
    platform_user = db.query(PlatformUser).filter(
        PlatformUser.platform_id == platform_id,
        PlatformUser.user_id == user_id
    ).first()
    
    if not platform_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в платформе"
        )
    
    db.delete(platform_user)
    db.commit()
    
    return {"message": "Пользователь удален из платформы"}

@router.get("/{platform_id}/devices", summary="Получить устройства платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def get_platform_devices(
    platform_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить список устройств платформы.
    """
    from app.models.device import Device
    
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    devices = db.query(Device).filter(Device.platform_id == platform_id).all()
    return devices
