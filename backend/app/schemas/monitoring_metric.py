from typing import Optional
from pydantic import BaseModel, Field


class MonitoringMetricBase(BaseModel):
    """Базовая схема для метрики мониторинга"""
    technical_name: str = Field(..., description="Техническое название метрики")
    human_name: str = Field(..., description="Человекочитаемое название")
    description: Optional[str] = Field(None, description="Описание метрики")
    unit: Optional[str] = Field(None, description="Единица измерения")
    category: str = Field(..., description="Категория метрики")
    data_type: str = Field("number", description="Тип данных (number, string, boolean)")
    min_value: Optional[str] = Field(None, description="Минимальное значение")
    max_value: Optional[str] = Field(None, description="Максимальное значение")
    is_active: bool = Field(True, description="Активна ли метрика")


class MonitoringMetricCreate(MonitoringMetricBase):
    """Схема для создания метрики"""
    pass


class MonitoringMetricUpdate(BaseModel):
    """Схема для обновления метрики"""
    technical_name: Optional[str] = Field(None, description="Техническое название метрики")
    human_name: Optional[str] = Field(None, description="Человекочитаемое название")
    description: Optional[str] = Field(None, description="Описание метрики")
    unit: Optional[str] = Field(None, description="Единица измерения")
    category: Optional[str] = Field(None, description="Категория метрики")
    data_type: Optional[str] = Field(None, description="Тип данных")
    min_value: Optional[str] = Field(None, description="Минимальное значение")
    max_value: Optional[str] = Field(None, description="Максимальное значение")
    is_active: Optional[bool] = Field(None, description="Активна ли метрика")


class MonitoringMetricResponse(MonitoringMetricBase):
    """Схема для ответа с метрикой"""
    id: int
    
    class Config:
        from_attributes = True 