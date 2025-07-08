from typing import Any, List, Optional
from datetime import datetime

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
from app.services.docker_service import docker_service

router = APIRouter()

@router.get("/platform-exporters", response_model=List[dict],
            summary="Получить экспортеры по типу для всех платформ",
            tags=["Platform Exporters"])
def get_platform_exporters_by_type(
    exporter_type: Optional[str] = Query(None, description="Тип экспортера (addreality, cubic_media)"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить список экспортеров определенного типа для всех платформ.
    Используется экспортерами для получения конфигураций платформ.
    """
    query = db.query(Exporter)
    
    if exporter_type:
        if exporter_type == "addreality":
            query = query.filter(Exporter.exporter_type == ExporterType.ADDREALITY)
        elif exporter_type == "cubic_media":
            query = query.filter(Exporter.exporter_type == ExporterType.CUBIC_MEDIA)
    
    exporters = query.all()
    
    result = []
    for exporter in exporters:
        # Получаем конфигурацию экспортера
        config = db.query(ExporterConfiguration).filter(
            ExporterConfiguration.exporter_id == exporter.id
        ).first()
        
        # Подготавливаем конфигурацию в зависимости от типа
        configuration = {}
        if config:
            if exporter.exporter_type == ExporterType.ADDREALITY and config.addreality_config:
                configuration = config.addreality_config
            else:
                configuration = {
                    "api_endpoint": config.api_endpoint,
                    "mac_addresses": config.mac_addresses,
                    "polling_interval": config.polling_interval,
                    "timeout": config.timeout,
                    "retry_count": config.retry_count,
                    "cache_enabled": config.cache_enabled,
                    "prometheus_labels": config.prometheus_labels
                }
        
        result.append({
            "platform_id": exporter.platform_id,
            "exporter_id": exporter.id,
            "name": exporter.name,
            "exporter_type": exporter.exporter_type.value,
            "status": exporter.status.value,
            "configuration": configuration
        })
    
    return result

@router.get("/platforms/{platform_id}/exporters", response_model=List[dict], 
            summary="Получить экспортеры платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def read_platform_exporters(
    platform_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список экспортеров конкретной платформы.
    Клиенты видят только экспортеры своей платформы.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Получаем экспортеры только для этой платформы
    exporters = db.query(Exporter).filter(
        Exporter.platform_id == platform_id
    ).offset(skip).limit(limit).all()
    
    result = []
    for exporter in exporters:
        # Получаем конфигурацию экспортера
        config = db.query(ExporterConfiguration).filter(
            ExporterConfiguration.exporter_id == exporter.id
        ).first()
        
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
            "updated_at": exporter.updated_at,
            "config": {
                "api_endpoint": config.api_endpoint if config else None,
                "mac_addresses": config.mac_addresses if config else [],
                "api_key": config.addreality_config.get("api_key") if config and config.addreality_config else None,
                "polling_interval": config.polling_interval if config else 30,
                "timeout": config.timeout if config else 15,
                "retry_count": config.retry_count if config else 3,
                "cache_enabled": config.cache_enabled if config else True,
                "prometheus_labels": config.prometheus_labels if config else {}
            } if config else {}
        })
    
    return result

@router.get("/platforms/{platform_id}/exporters/{exporter_id}", response_model=dict,
            summary="Получить экспортер платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def read_platform_exporter(
    platform_id: int,
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить конкретный экспортер платформы.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Получаем экспортер и проверяем принадлежность к платформе
    exporter = db.query(Exporter).filter(
        Exporter.id == exporter_id,
        Exporter.platform_id == platform_id
    ).first()
    
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
            "api_key": config.addreality_config.get("api_key") if config and config.addreality_config else None,
            "polling_interval": config.polling_interval if config else 30,
            "timeout": config.timeout if config else 15,
            "retry_count": config.retry_count if config else 3,
            "cache_enabled": config.cache_enabled if config else True,
            "prometheus_labels": config.prometheus_labels if config else {}
        } if config else {}
    }
    
    return result

@router.post("/platforms/{platform_id}/exporters", response_model=dict,
             summary="Создать экспортер для платформы",
             dependencies=[Depends(get_current_user)],
             tags=["Platform Exporters"])
def create_platform_exporter(
    platform_id: int,
    exporter_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Создать новый экспортер для конкретной платформы.
    Только админы и менеджеры платформы могут создавать экспортеры.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager"], db)
    
    # Проверяем, что платформа существует
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платформа не найдена"
        )
    
    # Проверяем, что экспортер с таким именем не существует в платформе
    existing_exporter = db.query(Exporter).filter(
        Exporter.name == exporter_data["name"],
        Exporter.platform_id == platform_id
    ).first()
    if existing_exporter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Экспортер с таким именем уже существует в платформе"
        )
    
    # Определяем тип экспортера
    platform_type = exporter_data.get("platform_type", "cubicmedia")
    if platform_type == "cubicmedia":
        exporter_type = ExporterType.CUBIC_MEDIA
    elif platform_type == "addreality":
        exporter_type = ExporterType.ADDREALITY
    else:
        exporter_type = ExporterType.CUBIC_MEDIA  # По умолчанию
    
    # Создаем экспортер
    db_exporter = Exporter(
        name=exporter_data["name"],
        description=exporter_data.get("description"),
        exporter_type=exporter_type,
        platform_id=platform_id,
        status=ExporterStatus.INACTIVE,
        config=exporter_data.get("config", {})
    )
    db.add(db_exporter)
    db.commit()
    db.refresh(db_exporter)
    
    # Создаем конфигурацию экспортера
    config_data = exporter_data.get("config", {})
    
    # Подготавливаем конфигурацию в зависимости от типа
    addreality_config = None
    if platform_type == "addreality":
        addreality_config = {
            "api_key": config_data.get("api_key"),
            "api_endpoint": config_data.get("api_endpoint")
        }
    
    db_config = ExporterConfiguration(
        exporter_id=db_exporter.id,
        api_endpoint=config_data.get("api_endpoint"),
        mac_addresses=config_data.get("mac_addresses", []),
        addreality_config=addreality_config,
        polling_interval=config_data.get("polling_interval", 30),
        timeout=config_data.get("timeout", 15),
        retry_count=config_data.get("retry_count", 3),
        cache_enabled=config_data.get("cache_enabled", True),
        prometheus_labels=config_data.get("prometheus_labels", {})
    )
    db.add(db_config)
    db.commit()
    
    log_audit(db, action="create_platform_exporter", user_id=current_user.id, 
              platform_id=platform_id, 
              details=f"Создан экспортер: {db_exporter.name} типа {exporter_type.value}")
    
    return {
        "id": db_exporter.id,
        "name": db_exporter.name,
        "exporter_type": db_exporter.exporter_type.value,
        "platform_type": platform_type,
        "status": db_exporter.status.value,
        "platform_id": platform_id,
        "message": "Экспортер успешно создан"
    }

@router.put("/platforms/{platform_id}/exporters/{exporter_id}", response_model=dict,
            summary="Обновить экспортер платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def update_platform_exporter(
    platform_id: int,
    exporter_id: int,
    exporter_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Обновить экспортер платформы.
    Только админы и менеджеры платформы могут обновлять экспортеры.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager"], db)
    
    # Получаем экспортер и проверяем принадлежность к платформе
    exporter = db.query(Exporter).filter(
        Exporter.id == exporter_id,
        Exporter.platform_id == platform_id
    ).first()
    
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Обновляем данные экспортера
    if "name" in exporter_update:
        exporter.name = exporter_update["name"]
    if "description" in exporter_update:
        exporter.description = exporter_update["description"]
    
    # Обновляем конфигурацию
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    
    if config and "config" in exporter_update:
        config_data = exporter_update["config"]
        
        if "api_endpoint" in config_data:
            config.api_endpoint = config_data["api_endpoint"]
        if "mac_addresses" in config_data:
            config.mac_addresses = config_data["mac_addresses"]
        if "polling_interval" in config_data:
            config.polling_interval = config_data["polling_interval"]
        if "timeout" in config_data:
            config.timeout = config_data["timeout"]
        if "retry_count" in config_data:
            config.retry_count = config_data["retry_count"]
        if "cache_enabled" in config_data:
            config.cache_enabled = config_data["cache_enabled"]
        if "prometheus_labels" in config_data:
            config.prometheus_labels = config_data["prometheus_labels"]
        
        # Обновляем Addreality конфигурацию
        if exporter.exporter_type == ExporterType.ADDREALITY:
            if not config.addreality_config:
                config.addreality_config = {}
            if "api_key" in config_data:
                config.addreality_config["api_key"] = config_data["api_key"]
            if "api_endpoint" in config_data:
                config.addreality_config["api_endpoint"] = config_data["api_endpoint"]
    
    db.commit()
    
    log_audit(db, action="update_platform_exporter", user_id=current_user.id, 
              platform_id=platform_id, 
              details=f"Обновлен экспортер: {exporter.name}")
    
    return {
        "id": exporter.id,
        "name": exporter.name,
        "message": "Экспортер успешно обновлен"
    }

@router.delete("/platforms/{platform_id}/exporters/{exporter_id}",
               summary="Удалить экспортер платформы",
               dependencies=[Depends(get_current_user)],
               tags=["Platform Exporters"])
def delete_platform_exporter(
    platform_id: int,
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Удалить экспортер платформы.
    Только админы и менеджеры платформы могут удалять экспортеры.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager"], db)
    
    # Получаем экспортер и проверяем принадлежность к платформе
    exporter = db.query(Exporter).filter(
        Exporter.id == exporter_id,
        Exporter.platform_id == platform_id
    ).first()
    
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Удаляем конфигурацию
    config = db.query(ExporterConfiguration).filter(
        ExporterConfiguration.exporter_id == exporter_id
    ).first()
    if config:
        db.delete(config)
    
    # Удаляем экспортер
    db.delete(exporter)
    db.commit()
    
    log_audit(db, action="delete_platform_exporter", user_id=current_user.id, 
              platform_id=platform_id, 
              details=f"Удален экспортер: {exporter.name}")
    
    return {
        "message": "Экспортер успешно удален"
    }



@router.get("/platforms/{platform_id}/prometheus/devices", response_model=List[dict],
            summary="Получить устройства платформы из Prometheus",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def get_platform_devices(
    platform_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить список устройств платформы из Prometheus.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Получаем устройства из Prometheus
    devices = prometheus_service.get_platform_devices(platform_id)
    
    return devices

@router.get("/platforms/{platform_id}/prometheus/stats", response_model=dict,
            summary="Получить статистику платформы из Prometheus",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def get_platform_stats(
    platform_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить статистику платформы из Prometheus.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Получаем статистику из Prometheus
    stats = prometheus_service.get_platform_stats(platform_id)
    
    return stats

@router.get("/platforms/{platform_id}/exporters/{exporter_id}/prometheus/devices", response_model=List[dict],
            summary="Получить устройства экспортера из Prometheus",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def get_exporter_devices(
    platform_id: int,
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить список устройств конкретного экспортера из Prometheus.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Проверяем, что экспортер принадлежит платформе
    exporter = db.query(Exporter).filter(
        Exporter.id == exporter_id,
        Exporter.platform_id == platform_id
    ).first()
    
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Получаем устройства экспортера из Prometheus
    devices = prometheus_service.get_exporter_metrics(exporter_id)
    
    return devices

@router.get("/platforms/{platform_id}/exporters/{exporter_id}/prometheus/stats", response_model=dict,
            summary="Получить статистику экспортера из Prometheus",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def get_exporter_stats(
    platform_id: int,
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить статистику конкретного экспортера из Prometheus.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Проверяем, что экспортер принадлежит платформе
    exporter = db.query(Exporter).filter(
        Exporter.id == exporter_id,
        Exporter.platform_id == platform_id
    ).first()
    
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Получаем статистику экспортера из Prometheus
    stats = prometheus_service.get_exporter_stats(exporter_id)
    
    return stats

@router.get("/platforms/{platform_id}/exporters/{exporter_id}/docker/status", response_model=dict,
            summary="Получить статус Docker контейнера экспортера",
            dependencies=[Depends(get_current_user)],
            tags=["Platform Exporters"])
def get_exporter_docker_status(
    platform_id: int,
    exporter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Получить статус Docker контейнера экспортера.
    """
    # Проверяем права доступа к платформе
    require_platform_role(current_user, platform_id, ["admin", "manager", "user"], db)
    
    # Получаем экспортер и проверяем принадлежность к платформе
    exporter = db.query(Exporter).filter(
        Exporter.id == exporter_id,
        Exporter.platform_id == platform_id
    ).first()
    
    if not exporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Экспортер не найден"
        )
    
    # Получаем статус Docker контейнера по типу экспортера
    status = docker_service.get_exporter_status(exporter.exporter_type.value)
    
    return {
        "exporter_type": exporter.exporter_type.value,
        "status": status,
        "exporter_id": exporter_id,
        "platform_id": platform_id
    } 