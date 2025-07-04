from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.platform import Platform
from app.db.session import get_db
from app.schemas.platform import PlatformCreate, PlatformUpdate, PlatformOut
from app.core.security import get_current_superadmin
from app.models.platform_user import PlatformUser
from app.schemas.platform_user import PlatformUserCreate, PlatformUserUpdate, PlatformUserOut
from app.models.user import User
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceOut
from app.core.deps import get_current_user_id, get_current_user
from app.core.platform_permissions import require_platform_role
from app.core.audit import log_audit
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut

router = APIRouter()

@router.post("/platforms/", response_model=PlatformOut, status_code=201)
def create_platform(platform_in: PlatformCreate, db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    platform = Platform(**platform_in.dict())
    db.add(platform)
    db.commit()
    db.refresh(platform)
    return platform

@router.get("/platforms/", response_model=list[PlatformOut])
def list_platforms(db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    return db.query(Platform).all()

@router.get("/platforms/{platform_id}", response_model=PlatformOut)
def get_platform(platform_id: int, db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    return platform

@router.patch("/platforms/{platform_id}", response_model=PlatformOut)
def update_platform(platform_id: int, platform_in: PlatformUpdate, db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    for field, value in platform_in.dict(exclude_unset=True).items():
        setattr(platform, field, value)
    db.commit()
    db.refresh(platform)
    return platform

@router.delete("/platforms/{platform_id}", status_code=204)
def delete_platform(platform_id: int, db: Session = Depends(get_db), user=Depends(get_current_superadmin)):
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    db.delete(platform)
    db.commit()
    return None

@router.post("/platforms/{platform_id}/users/", response_model=PlatformUserOut, status_code=201)
def add_platform_user(platform_id: int, user_in: PlatformUserCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager'], db=db)
    platform_user = PlatformUser(platform_id=platform_id, **user_in.dict())
    db.add(platform_user)
    db.commit()
    db.refresh(platform_user)
    log_audit(db, action="add_platform_user", user_id=user_id, platform_id=platform_id, details=f"Добавлен пользователь {user_in.user_id} с ролью {user_in.role}")
    return platform_user

@router.patch("/platforms/{platform_id}/users/{platform_user_id}", response_model=PlatformUserOut)
def update_platform_user(platform_id: int, platform_user_id: int, user_in: PlatformUserUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager'], db=db)
    platform_user = db.query(PlatformUser).filter(PlatformUser.id == platform_user_id, PlatformUser.platform_id == platform_id).first()
    if not platform_user:
        raise HTTPException(status_code=404, detail="Platform user not found")
    old_role = platform_user.role
    platform_user.role = user_in.role
    db.commit()
    db.refresh(platform_user)
    log_audit(db, action="update_platform_user", user_id=user_id, platform_id=platform_id, details=f"Изменена роль пользователя {platform_user.user_id} с {old_role} на {user_in.role}")
    return platform_user

@router.delete("/platforms/{platform_id}/users/{platform_user_id}", status_code=204)
def delete_platform_user(platform_id: int, platform_user_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager'], db=db)
    platform_user = db.query(PlatformUser).filter(PlatformUser.id == platform_user_id, PlatformUser.platform_id == platform_id).first()
    if not platform_user:
        raise HTTPException(status_code=404, detail="Platform user not found")
    db.delete(platform_user)
    db.commit()
    log_audit(db, action="delete_platform_user", user_id=user_id, platform_id=platform_id, details=f"Удалён пользователь {platform_user.user_id}")
    return None

@router.get("/platforms/{platform_id}/users/", response_model=list[PlatformUserOut])
def list_platform_users(platform_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager', 'user', 'viewer'], db=db)
    return db.query(PlatformUser).filter(PlatformUser.platform_id == platform_id).all()

@router.get("/platforms/{platform_id}/devices/", response_model=list[DeviceOut])
def list_platform_devices(platform_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager', 'user', 'viewer'], db=db)
    return db.query(Device).filter(Device.platform_id == platform_id).all()

@router.post("/platforms/{platform_id}/devices/", response_model=DeviceOut, status_code=201)
def add_platform_device(platform_id: int, device_in: DeviceCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager', 'user'], db=db)
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    device_count = db.query(Device).filter(Device.platform_id == platform_id).count()
    if platform.devices_limit is not None and device_count >= platform.devices_limit:
        raise HTTPException(status_code=400, detail="Device limit reached for this platform")
    # Проверка уникальности grafana_uid
    if device_in.grafana_uid:
        existing = db.query(Device).filter(Device.grafana_uid == device_in.grafana_uid).first()
        if existing:
            raise HTTPException(status_code=400, detail="Устройство с таким ID плеера Grafana уже существует")
    device = Device(platform_id=platform_id, **device_in.dict())
    db.add(device)
    db.commit()
    db.refresh(device)
    log_audit(db, action="add_platform_device", user_id=user_id, platform_id=platform_id, details=f"Добавлено устройство {device.id}")
    return device

@router.delete("/platforms/{platform_id}/devices/{device_id}", status_code=204)
def delete_platform_device(platform_id: int, device_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager', 'user'], db=db)
    device = db.query(Device).filter(Device.id == device_id, Device.platform_id == platform_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    log_audit(db, action="delete_platform_device", user_id=user_id, platform_id=platform_id, details=f"Удалено устройство {device_id}")
    return None

@router.get("/platforms/{platform_id}/audit/", response_model=list[AuditLogOut])
def get_platform_audit(platform_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager'], db=db)
    return db.query(AuditLog).filter(AuditLog.platform_id == platform_id).order_by(AuditLog.timestamp.desc()).all()

@router.get("/my-platforms/", response_model=list[PlatformOut])
def my_platforms(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Получаем все PlatformUser для текущего пользователя
    platform_links = db.query(PlatformUser).filter(PlatformUser.user_id == user.id).all()
    platform_ids = [pu.platform_id for pu in platform_links]
    if not platform_ids:
        return []
    platforms = db.query(Platform).filter(Platform.id.in_(platform_ids)).all()
    return platforms

@router.put("/platforms/{platform_id}/devices/{device_id}", response_model=DeviceOut)
def update_platform_device(platform_id: int, device_id: int, device_in: DeviceUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    require_platform_role(platform_id, user_id, allowed_roles=['admin', 'manager', 'user'], db=db)
    device = db.query(Device).filter(Device.id == device_id, Device.platform_id == platform_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    # Проверка уникальности grafana_uid
    if device_in.grafana_uid:
        existing = db.query(Device).filter(Device.grafana_uid == device_in.grafana_uid, Device.id != device_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Устройство с таким ID плеера Grafana уже существует")
    for field, value in device_in.dict(exclude_unset=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device 