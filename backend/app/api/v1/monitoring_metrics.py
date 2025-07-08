from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.monitoring_metric import MonitoringMetric
from app.schemas.monitoring_metric import (
    MonitoringMetricCreate, 
    MonitoringMetricResponse, 
    MonitoringMetricUpdate
)
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[MonitoringMetricResponse])
def get_monitoring_metrics(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    is_active: Optional[bool] = Query(None, description="Фильтр по активности"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список метрик мониторинга."""
    query = db.query(MonitoringMetric)
    
    if category:
        query = query.filter(MonitoringMetric.category == category)
    if is_active is not None:
        query = query.filter(MonitoringMetric.is_active == is_active)
    
    metrics = query.offset(skip).limit(limit).all()
    return metrics


@router.get("/categories", response_model=List[str])
def get_metric_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список категорий метрик."""
    categories = db.query(MonitoringMetric.category).distinct().all()
    return [cat[0] for cat in categories]


@router.get("/{metric_id}", response_model=MonitoringMetricResponse)
def get_monitoring_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить метрику по ID."""
    metric = db.query(MonitoringMetric).filter(MonitoringMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Метрика не найдена"
        )
    return metric


@router.post("/", response_model=MonitoringMetricResponse)
def create_monitoring_metric(
    metric: MonitoringMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую метрику мониторинга."""
    # Проверяем уникальность технического названия
    existing = db.query(MonitoringMetric).filter(
        MonitoringMetric.technical_name == metric.technical_name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Метрика с таким техническим названием уже существует"
        )
    
    db_metric = MonitoringMetric(**metric.dict())
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric


@router.put("/{metric_id}", response_model=MonitoringMetricResponse)
def update_monitoring_metric(
    metric_id: int,
    metric_update: MonitoringMetricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить метрику мониторинга."""
    metric = db.query(MonitoringMetric).filter(MonitoringMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Метрика не найдена"
        )
    
    update_data = metric_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(metric, field, value)
    
    db.commit()
    db.refresh(metric)
    return metric


@router.delete("/{metric_id}")
def delete_monitoring_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить метрику мониторинга."""
    metric = db.query(MonitoringMetric).filter(MonitoringMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Метрика не найдена"
        )
    
    db.delete(metric)
    db.commit()
    return {"message": "Метрика успешно удалена"} 