from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.platform import Platform
from app.schemas.platform import PlatformResponse, PlatformCreate, PlatformUpdate
from app.models.platform_user import PlatformUser
from app.models.device import Device
from app.models.log import Log
from app.core.platform_permissions import require_platform_role
from app.schemas.device import Device as DeviceResponse, DeviceCreate, DeviceUpdate
from app.models.user import User

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
            response_model=List[DeviceResponse],
            tags=["Platforms"])
def get_platform_devices(
    platform_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    """
    Получить список устройств платформы.
    """
    require_platform_role(platform_id, user.id, allowed_roles=['admin', 'manager', 'user', 'viewer'], db=db)
    
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    devices = db.query(Device).filter(Device.platform_id == platform_id).all()
    return devices

@router.post("/{platform_id}/devices", response_model=DeviceResponse, summary="Добавить устройство в платформу", tags=["Platforms"])
def add_device_to_platform(
    platform_id: int,
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Any:
    """
    Добавить новое устройство в платформу.
    """
    require_platform_role(platform_id, user.id, allowed_roles=['admin', 'manager'], db=db)
    
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Платформа не найдена")

    device_count = db.query(Device).filter(Device.platform_id == platform_id).count()
    if platform.devices_limit is not None and device_count >= platform.devices_limit:
        raise HTTPException(status_code=400, detail="Достигнут лимит устройств для этой платформы")
    
    # Исключаем platform_id из данных схемы, так как он передается отдельно
    device_data = device_in.dict()
    device_data.pop('platform_id', None)  # Удаляем platform_id если он есть
        
    db_device = Device(**device_data, platform_id=platform_id, user_id=user.id)
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.put("/{platform_id}/devices/{device_id}", response_model=DeviceResponse, summary="Обновить устройство в платформе", tags=["Platforms"])
def update_device_in_platform(
    platform_id: int,
    device_id: int,
    device_update: DeviceUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Any:
    """
    Обновить устройство в платформе.
    """
    require_platform_role(platform_id, user.id, allowed_roles=['admin', 'manager'], db=db)
    
    device = db.query(Device).filter(Device.id == device_id, Device.platform_id == platform_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено в этой платформе")
    
    update_data = device_update.dict(exclude_unset=True)
    if "phone" in update_data and update_data["phone"] is not None:
        update_data["phone"] = update_data["phone"].lstrip('+')
    
    for field, value in update_data.items():
        setattr(device, field, value)
    
    db.commit()
    db.refresh(device)
    return device

@router.delete("/{platform_id}/devices/{device_id}", summary="Удалить устройство из платформы", tags=["Platforms"])
def remove_device_from_platform(
    platform_id: int,
    device_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Any:
    """
    Удалить устройство из платформы.
    """
    require_platform_role(platform_id, user.id, allowed_roles=['admin', 'manager'], db=db)
    
    device = db.query(Device).filter(Device.id == device_id, Device.platform_id == platform_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено в этой платформе")
        
    db.delete(device)
    db.commit()
    
    return {"message": "Устройство удалено из платформы"}

@router.get("/my-platforms/", response_model=List[PlatformResponse], summary="Платформы текущего пользователя", tags=["Platforms"])
def my_platforms(db: Session = Depends(get_db), user=Depends(get_current_user)):
    platform_links = db.query(PlatformUser).filter(PlatformUser.user_id == user.id).all()
    platform_ids = [pu.platform_id for pu in platform_links]
    if not platform_ids:
        return []
    platforms = db.query(Platform).filter(Platform.id.in_(platform_ids)).all()
    return platforms

@router.get("/{platform_id}/logs", summary="Получить логи команд платформы", tags=["Platforms"])
def get_platform_logs(platform_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    require_platform_role(platform_id, user.id, allowed_roles=["admin", "manager", "user", "viewer"], db=db)
    device_ids = [d.id for d in db.query(Device).filter(Device.platform_id == platform_id).all()]
    if not device_ids:
        return []
    logs = db.query(Log).filter(Log.device_id.in_(device_ids)).order_by(Log.created_at.desc()).all()
    return logs

@router.get("/{platform_id}/limits", summary="Получить информацию о лимитах платформы", tags=["Platforms"])
def get_platform_limits(
    platform_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Any:
    """
    Получить информацию о лимитах платформы и текущем использовании.
    """
    require_platform_role(platform_id, user.id, allowed_roles=['admin', 'manager', 'user', 'viewer'], db=db)
    
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Подсчитываем текущее количество устройств
    device_count = db.query(Device).filter(Device.platform_id == platform_id).count()
    
    # Подсчитываем количество SMS (если есть логика для этого)
    # sms_count = db.query(SMSLog).filter(SMSLog.platform_id == platform_id).count()
    sms_count = 0  # Пока заглушка
    
    limits_info = {
        "platform_id": platform_id,
        "platform_name": platform.name,
        "devices": {
            "current": device_count,
            "limit": platform.devices_limit,
            "available": platform.devices_limit - device_count if platform.devices_limit else None,
            "usage_percentage": (device_count / platform.devices_limit * 100) if platform.devices_limit else None
        },
        "sms": {
            "current": sms_count,
            "limit": platform.sms_limit,
            "available": platform.sms_limit - sms_count if platform.sms_limit else None,
            "usage_percentage": (sms_count / platform.sms_limit * 100) if platform.sms_limit else None
        }
    }
    
    return limits_info
