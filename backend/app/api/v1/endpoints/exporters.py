from typing import Any, List, Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.exporter import Exporter, ExporterType, ExporterStatus
from app.models.exporter_configuration import ExporterConfiguration
from app.models.platform import Platform
from app.models.user import User
from app.core.platform_permissions import require_platform_role
from app.core.audit import log_audit
from app.services.exporter_service import exporter_service
from app.services.prometheus_service import prometheus_service

router = APIRouter()

@router.get("/", response_model=List[dict], summary="Получить все экспортеры",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def read_exporters(
    db: Session = Depends(get_db),
    platform_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список всех экспортеров с возможностью фильтрации по платформе.
    """
    query = db.query(Exporter)
    
    if platform_id:
        query = query.filter(Exporter.platform_id == platform_id)
    
    exporters = query.offset(skip).limit(limit).all()
    
    result = []
    for exporter in exporters:
        result.append({
            "id": exporter.id,
            "name": exporter.name,
            "description": exporter.description,
            "exporter_type": exporter.exporter_type.value,
            "platform_type": "cubicmedia" if exporter.exporter_type.value == "cubic_media" else "addreality",
            "status": exporter.status.value,
            "platform_id": exporter.platform_id,
            "container_name": exporter.container_name,
            "container_port": exporter.container_port,
            "container_status": exporter.container_status,
            "last_metrics_count": exporter.last_metrics_count,
            "last_successful_collection": exporter.last_successful_collection,
            "last_error_message": exporter.last_error_message,
            "created_at": exporter.created_at,
            "updated_at": exporter.updated_at
        })
    
    return result

@router.get("/devices", response_model=List[dict], summary="Получить все устройства всех экспортеров",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def get_all_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить все устройства всех экспортеров с актуальными метками из Prometheus.
    """
    # Определяем, какие экспортеры доступны текущему пользователю
    if current_user.is_superadmin:
        exporters = db.query(Exporter).all()
    else:
        platform_ids = [role.platform_id for role in current_user.platform_roles]
        exporters = db.query(Exporter).filter(Exporter.platform_id.in_(platform_ids)).all()

    all_devices: List[dict] = []

    # Собираем устройства из Prometheus по каждому экспортеру
    for exporter in exporters:
        try:
            if exporter.exporter_type.value == "addreality":
                exporter_devices = prometheus_service.get_addreality_devices(platform_id=exporter.platform_id, exporter_id=exporter.id)
            else:
                exporter_devices = prometheus_service.get_exporter_metrics(exporter.id)
            # Если Prometheus ничего не вернул (например, экспортер не отправляет метрики),
            # то добавим устройства из конфигурации, чтобы они тоже отображались.
            if not exporter_devices:
                config = db.query(ExporterConfiguration).filter(
                    ExporterConfiguration.exporter_id == exporter.id
                ).first()
                if config and config.mac_addresses:
                    for mac in config.mac_addresses:
                        exporter_devices.append({
                            "mac": mac,
                            "exporter_id": exporter.id,
                            "exporter_name": exporter.name,
                            "platform_id": exporter.platform_id,
                            "status": 0,
                            "status_text": "offline"
                        })
        except Exception as e:
            # В случае ошибки запросов к Prometheus добавляем базовые устройства, чтобы фронт всё равно что-то отобразил
            config = db.query(ExporterConfiguration).filter(
                ExporterConfiguration.exporter_id == exporter.id
            ).first()
            if config and config.mac_addresses:
                exporter_devices = [{
                    "mac": mac,
                    "exporter_id": exporter.id,
                    "exporter_name": exporter.name,
                    "platform_id": exporter.platform_id,
                    "status": 0,
                    "status_text": "offline"
                } for mac in config.mac_addresses]
            else:
                exporter_devices = []

        all_devices.extend(exporter_devices)

    return all_devices

@router.get("/stats", response_model=dict, summary="Получить статистику экспортеров",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def get_exporters_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить общую статистику по экспортерам.
    """
    return exporter_service.get_exporter_stats(db)

@router.get("/{exporter_id}", response_model=dict, summary="Получить экспортер",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def read_exporter(
    exporter_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить экспортер по ID.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Получаем конфигурацию экспортера
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    result = {
        "id": exporter.id,
        "name": exporter.name,
        "description": exporter.description,
        "exporter_type": exporter.exporter_type.value,
        "platform_type": "cubicmedia" if exporter.exporter_type.value == "cubic_media" else "addreality",
        "status": exporter.status.value,
        "platform_id": exporter.platform_id,
        "container_name": exporter.container_name,
        "container_port": exporter.container_port,
        "container_status": exporter.container_status,
        "last_metrics_count": exporter.last_metrics_count,
        "last_successful_collection": exporter.last_successful_collection,
        "last_error_message": exporter.last_error_message,
        "created_at": exporter.created_at,
        "updated_at": exporter.updated_at,
        "config": {
            "api_endpoint": config.api_endpoint if config else None,
            "mac_addresses": config.mac_addresses if config else [],
            "polling_interval": config.polling_interval if config else 30,
            "timeout": config.timeout if config else 15,
            "retry_count": config.retry_count if config else 3,
            "cache_enabled": config.cache_enabled if config else True,
            "prometheus_labels": config.prometheus_labels if config else {}
        } if config else {}
    }
    result["mac_addresses"] = result["config"].get("mac_addresses", []) if result.get("config") else []
    return result

@router.post("/", response_model=dict, summary="Создать экспортер",
             dependencies=[Depends(get_current_user)],
             tags=["Exporters"])
def create_exporter(
    exporter_data: dict,  # {"name": str, "description": str, "exporter_type": str, "platform_id": int, "config": dict}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Создать новый экспортер для платформы.
    """
    # Проверяем, что платформа существует
    platform = db.query(Platform).filter(Platform.id == exporter_data["platform_id"]).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter_data["platform_id"], ["admin", "manager"], db)
    
    # Проверяем, что экспортер с таким именем не существует в платформе
    existing_exporter = db.query(Exporter).filter(
        Exporter.name == exporter_data["name"],
        Exporter.platform_id == exporter_data["platform_id"]
    ).first()
    if existing_exporter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Экспортер с таким именем не существует в платформе"
        )
    
    # Создаем экспортер
    # Маппинг platform_type в exporter_type
    platform_type = exporter_data.get("platform_type", "cubicmedia")
    if platform_type == "cubicmedia":
        exporter_type = ExporterType.CUBIC_MEDIA
    elif platform_type == "addreality":
        exporter_type = ExporterType.ADDREALITY
    else:
        exporter_type = ExporterType.CUBIC_MEDIA  # По умолчанию
    
    db_exporter = Exporter(
        name=exporter_data["name"],
        description=exporter_data.get("description"),
        exporter_type=exporter_type,
        platform_id=exporter_data["platform_id"],
        status=ExporterStatus.INACTIVE,  # Начинаем с неактивного статуса
        config=exporter_data.get("config", {})
    )
    db.add(db_exporter)
    db.commit()
    db.refresh(db_exporter)
    
    # Создаем конфигурацию экспортера
    config_data = exporter_data.get("config", {})
    db_config = ExporterConfiguration(
        exporter_id=db_exporter.id,
        api_endpoint=config_data.get("api_endpoint"),
        mac_addresses=config_data.get("mac_addresses", []),
        polling_interval=config_data.get("polling_interval", 30),
        timeout=config_data.get("timeout", 15),
        retry_count=config_data.get("retry_count", 3),
        cache_enabled=config_data.get("cache_enabled", True),
        prometheus_labels=config_data.get("prometheus_labels", {})
    )
    db.add(db_config)
    db.commit()
    
    log_audit(db, action="create_exporter", user_id=current_user.id, 
              platform_id=exporter_data["platform_id"], 
              details=f"Создан экспортер: {db_exporter.name} типа {exporter_type.value}")
    
    return {
        "id": db_exporter.id,
        "name": db_exporter.name,
        "exporter_type": db_exporter.exporter_type.value,
        "status": db_exporter.status.value,
        "platform_id": db_exporter.platform_id,
        "message": "Экспортер создан успешно"
    }

@router.put("/{exporter_id}", response_model=dict, summary="Обновить экспортер",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def update_exporter(
    exporter_id: int,
    exporter_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Обновить экспортер.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    # Обновляем экспортер
    for field, value in exporter_update.items():
        if field in ["exporter_type", "platform_type"]:
            continue  # Не позволяем менять тип экспортёра
        if hasattr(exporter, field):
            setattr(exporter, field, value)
    
    # Обновляем конфигурацию, если она передана
    if "config" in exporter_update:
        config = db.query(ExporterConfiguration).filter(
            ExporterConfiguration.exporter_id == exporter_id
        ).first()
        config_data = exporter_update["config"]
        # --- ДОБАВЛЕНО: поддержка addreality_config ---
        exporter_type = getattr(exporter, "exporter_type", None)
        is_addreality = False
        if exporter_type is not None:
            if hasattr(exporter_type, "value"):
                is_addreality = exporter_type.value == "addreality"
            else:
                is_addreality = exporter_type == "addreality"
        if is_addreality:
            if config:
                # Обновляем addreality_config
                addreality_config = config.addreality_config or {}
                if "api_key" in config_data:
                    addreality_config["api_key"] = config_data["api_key"]
                if "api_endpoint" in config_data:
                    addreality_config["api_endpoint"] = config_data["api_endpoint"]
                if "tags" in config_data:
                    addreality_config["tags"] = config_data["tags"]
                config.addreality_config = addreality_config
            else:
                # Создаём новую конфигурацию с addreality_config
                db_config = ExporterConfiguration(
                    exporter_id=exporter_id,
                    addreality_config={
                        "api_key": config_data.get("api_key"),
                        "api_endpoint": config_data.get("api_endpoint"),
                        "tags": config_data.get("tags", [])
                    }
                )
                db.add(db_config)
        else:
            # Старое поведение для других типов
            if config:
                for field, value in config_data.items():
                    if hasattr(config, field):
                        setattr(config, field, value)
            else:
                db_config = ExporterConfiguration(
                    exporter_id=exporter_id,
                    api_endpoint=config_data.get("api_endpoint"),
                    mac_addresses=config_data.get("mac_addresses", []),
                    polling_interval=config_data.get("polling_interval", 30),
                    timeout=config_data.get("timeout", 15),
                    retry_count=config_data.get("retry_count", 3),
                    cache_enabled=config_data.get("cache_enabled", True),
                    prometheus_labels=config_data.get("prometheus_labels", {})
                )
                db.add(db_config)
        # --- Логирование для отладки ---
        logging.warning(f"[EXPORTER UPDATE] Payload: {exporter_update}")
        logging.warning(f"[EXPORTER UPDATE] Config after update: {config.addreality_config if config else 'no config'}")
    
    db.commit()
    db.refresh(exporter)
    
    log_audit(db, action="update_exporter", user_id=current_user.id, 
              platform_id=exporter.platform_id, 
              details=f"Обновлен экспортер: {exporter.name}")
    
    return {
        "id": exporter.id,
        "name": exporter.name,
        "status": exporter.status.value,
        "message": "Экспортер обновлен успешно"
    }

@router.delete("/{exporter_id}", summary="Удалить экспортер",
               dependencies=[Depends(get_current_user)],
               tags=["Exporters"])
def delete_exporter(
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Удалить экспортер.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin"], db)
    
    # Удаляем конфигурацию экспортера
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    if config:
        db.delete(config)
    
    # Удаляем экспортер
    db.delete(exporter)
    db.commit()
    
    log_audit(db, action="delete_exporter", user_id=current_user.id, 
              platform_id=exporter.platform_id, 
              details=f"Удален экспортер: {exporter.name}")
    
    return {"message": "Экспортер успешно удален"}

@router.post("/{exporter_id}/start", summary="Запустить экспортер",
             dependencies=[Depends(get_current_user)],
             tags=["Exporters"])
def start_exporter(
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Запустить экспортер (создать Docker контейнер).
    """
    exporter = exporter_service.get_exporter_by_id(db, exporter_id)
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    success = exporter_service.start_exporter(db, exporter_id, current_user.id)
    if success:
        return {"message": "Экспортер запущен успешно"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при запуске экспортера"
        )

@router.post("/{exporter_id}/stop", summary="Остановить экспортер",
             dependencies=[Depends(get_current_user)],
             tags=["Exporters"])
def stop_exporter(
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Остановить экспортер (остановить Docker контейнер).
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    # TODO: Здесь будет логика остановки Docker контейнера
    # Пока просто обновляем статус
    exporter.status = ExporterStatus.INACTIVE
    exporter.container_status = "stopped"
    db.commit()
    
    log_audit(db, action="stop_exporter", user_id=current_user.id, 
              platform_id=exporter.platform_id, 
              details=f"Остановлен экспортер: {exporter.name}")
    
    return {"message": "Экспортер остановлен успешно"}

@router.get("/{exporter_id}/metrics", summary="Получить метрики экспортера",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def get_exporter_metrics(
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить текущие метрики экспортера.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager", "user", "viewer"], db)

    # Получаем метрики из Prometheus
    metrics = prometheus_service.get_exporter_metrics(exporter_id)
    stats = prometheus_service.get_exporter_stats(exporter_id)

    return {
        "exporter_id": exporter.id,
        "name": exporter.name,
        "status": exporter.status.value,
        "last_metrics_count": len(metrics),
        "last_successful_collection": exporter.last_successful_collection,
        "last_error_message": exporter.last_error_message,
        "metrics": metrics,
        "stats": stats
    }

@router.post("/{exporter_id}/sync", summary="Синхронизировать экспортер",
             dependencies=[Depends(get_current_user)],
             tags=["Exporters"])
def sync_exporter(
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Синхронизировать экспортер (запустить сбор метрик).
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    # TODO: Здесь будет логика синхронизации с внешним API
    # Пока просто обновляем время последней синхронизации
    exporter.last_successful_collection = datetime.utcnow()
    exporter.last_metrics_count = 0  # TODO: Реальное количество метрик
    db.commit()
    
    log_audit(db, action="sync_exporter", user_id=current_user.id, 
              platform_id=exporter.platform_id, 
              details=f"Синхронизирован экспортер: {exporter.name}")
    
    return {"message": "Экспортер синхронизирован успешно"}

@router.get("/{exporter_id}/macs", response_model=List[str], summary="Получить MAC-адреса экспортера",
            tags=["Exporters"])
def get_exporter_macs(
    exporter_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить список MAC-адресов для экспортера.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    if not config:
        return []
    
    return config.mac_addresses or []

@router.post("/{exporter_id}/macs", response_model=dict, summary="Добавить MAC-адреса",
             dependencies=[Depends(get_current_user)],
             tags=["Exporters"])
def add_exporter_macs(
    exporter_id: int,
    mac_addresses: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Добавить MAC-адреса к экспортеру.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    if not config:
        # Создаем конфигурацию если её нет
        config = ExporterConfiguration(
            exporter_id=exporter_id,
            mac_addresses=mac_addresses
        )
        db.add(config)
    else:
        # Добавляем новые MAC-адреса к существующим
        existing_macs = config.mac_addresses or []
        new_macs = [mac for mac in mac_addresses if mac not in existing_macs]
        config.mac_addresses = existing_macs + new_macs
    
    db.commit()
    
    log_audit(db, action="add_exporter_macs", user_id=current_user.id,
              platform_id=exporter.platform_id,
              details=f"Добавлены MAC-адреса к экспортеру {exporter.name}: {new_macs}")
    
    return {
        "message": "MAC-адреса добавлены",
        "added_count": len(new_macs),
        "total_count": len(config.mac_addresses)
    }

@router.delete("/{exporter_id}/macs", response_model=dict, summary="Удалить MAC-адреса",
              dependencies=[Depends(get_current_user)],
              tags=["Exporters"])
def remove_exporter_macs(
    exporter_id: int,
    mac_addresses: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Удалить MAC-адреса из экспортера.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    if not config or not config.mac_addresses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У экспортера нет MAC-адресов"
        )
    
    # Удаляем указанные MAC-адреса
    existing_macs = config.mac_addresses
    removed_macs = [mac for mac in mac_addresses if mac in existing_macs]
    config.mac_addresses = [mac for mac in existing_macs if mac not in mac_addresses]
    
    db.commit()
    
    log_audit(db, action="remove_exporter_macs", user_id=current_user.id,
              platform_id=exporter.platform_id,
              details=f"Удалены MAC-адреса из экспортера {exporter.name}: {removed_macs}")
    
    return {
        "message": "MAC-адреса удалены",
        "removed_count": len(removed_macs),
        "remaining_count": len(config.mac_addresses)
    }

@router.put("/{exporter_id}/macs", response_model=dict, summary="Заменить MAC-адреса",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def replace_exporter_macs(
    exporter_id: int,
    mac_addresses: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Заменить все MAC-адреса экспортера.
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager"], db)
    
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    if not config:
        # Создаем конфигурацию если её нет
        config = ExporterConfiguration(
            exporter_id=exporter_id,
            mac_addresses=mac_addresses
        )
        db.add(config)
    else:
        # Заменяем все MAC-адреса
        old_macs = config.mac_addresses or []
        config.mac_addresses = mac_addresses
    
    db.commit()
    
    log_audit(db, action="replace_exporter_macs", user_id=current_user.id,
              platform_id=exporter.platform_id,
              details=f"Заменены MAC-адреса экспортера {exporter.name}: {len(old_macs)} -> {len(mac_addresses)}")
    
    return {
        "message": "MAC-адреса заменены",
        "old_count": len(old_macs),
        "new_count": len(mac_addresses)
    }

@router.get("/macs/for-exporter/{exporter_id}", response_model=List[dict], summary="Получить MAC-адреса для экспортера",
            dependencies=[Depends(get_current_user)],
            tags=["Exporters"])
def get_macs_for_exporter(
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить MAC-адреса в формате для экспортера (с дополнительными полями).
    """
    exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Проверяем права доступа к платформе
    require_platform_role(current_user, exporter.platform_id, ["admin", "manager", "user", "viewer"], db)
    
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    if not config or not config.mac_addresses:
        return []
    
    # Формируем данные для экспортера
    macs_data = []
    for mac in config.mac_addresses:
        macs_data.append({
            "platform_id": exporter.platform_id,
            "mac": mac,
            "name": f"device_{mac.replace(':', '')}",  # Генерируем имя устройства
            "ip": "",  # IP будет заполнен экспортером
            "outip": ""  # Внешний IP будет заполнен экспортером
        })
    
    return macs_data

@router.get('/exporter-macs', response_model=List[dict], summary="Получить все MAC-адреса всех экспортёров (с платформой)", tags=["Exporters"])
def get_all_exporter_macs(db: Session = Depends(get_db), platform_type: str = Query(None)):
    query = db.query(ExporterConfiguration, Exporter).join(Exporter, ExporterConfiguration.exporter_id == Exporter.id)
    if platform_type:
        query = query.filter(Exporter.platform_type == platform_type)
    result = []
    for config, exporter in query.all():
        for mac in config.mac_addresses or []:
            result.append({
                'mac': mac,
                'exporter_id': exporter.id,
                'platform_id': exporter.platform_id
            })
    return result 