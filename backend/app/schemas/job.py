from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class JobBase(BaseModel):
    """Базовая схема для задания"""
    name: str = Field(..., description="Название задания")
    description: Optional[str] = Field(None, description="Описание задания")
    command: str = Field(..., description="Команда для выполнения")
    platform_id: int = Field(..., description="ID платформы")
    device_id: Optional[int] = Field(None, description="ID устройства (опционально)")
    is_active: bool = Field(True, description="Активно ли задание")
    schedule: Optional[str] = Field(None, description="Расписание (cron expression)")
    timeout: int = Field(300, description="Таймаут в секундах")
    retry_count: int = Field(3, description="Количество попыток")
    retry_delay: int = Field(60, description="Задержка между попытками в секундах")

    # Prometheus monitoring fields
    monitoring_device_mac: Optional[str] = Field(None, description="MAC адрес устройства для мониторинга")
    monitoring_metric: Optional[str] = Field(None, description="Название метрики Prometheus")
    operator: Optional[str] = Field(None, description="Оператор сравнения (>, <, =, !=, >=, <=)")
    threshold_value: Optional[str] = Field(None, description="Пороговое значение для сравнения")
    last_prometheus_value: Optional[str] = Field(None, description="Последнее значение из Prometheus")
    last_check_time: Optional[datetime] = Field(None, description="Время последней проверки")

    conditions: Optional[List[dict]] = Field(default_factory=list, description="Условия")
    actions: Optional[List[dict]] = Field(default_factory=list, description="Действия")


class JobCreate(JobBase):
    """Схема для создания задания"""
    pass


class JobUpdate(BaseModel):
    """Схема для обновления задания"""
    name: Optional[str] = Field(None, description="Название задания")
    description: Optional[str] = Field(None, description="Описание задания")
    command: Optional[str] = Field(None, description="Команда для выполнения")
    platform_id: Optional[int] = Field(None, description="ID платформы")
    device_id: Optional[int] = Field(None, description="ID устройства (опционально)")
    is_active: Optional[bool] = Field(None, description="Активно ли задание")
    schedule: Optional[str] = Field(None, description="Расписание (cron expression)")
    timeout: Optional[int] = Field(None, description="Таймаут в секундах")
    retry_count: Optional[int] = Field(None, description="Количество попыток")
    retry_delay: Optional[int] = Field(None, description="Задержка между попытками в секундах")
    
    # Prometheus monitoring fields
    monitoring_device_mac: Optional[str] = Field(None, description="MAC адрес устройства для мониторинга")
    monitoring_metric: Optional[str] = Field(None, description="Название метрики Prometheus")
    operator: Optional[str] = Field(None, description="Оператор сравнения (>, <, =, !=, >=, <=)")
    threshold_value: Optional[str] = Field(None, description="Пороговое значение для сравнения")
    last_prometheus_value: Optional[str] = Field(None, description="Последнее значение из Prometheus")
    last_check_time: Optional[datetime] = Field(None, description="Время последней проверки")


class JobResponse(JobBase):
    """Схема для ответа с заданием"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class JobExecutionBase(BaseModel):
    """Базовая схема для выполнения задания"""
    job_id: int = Field(..., description="ID задания")
    status: str = Field("pending", description="Статус выполнения")
    success: Optional[bool] = Field(None, description="Успешно ли выполнено")
    started_at: Optional[datetime] = Field(None, description="Время начала")
    completed_at: Optional[datetime] = Field(None, description="Время завершения")
    duration: Optional[int] = Field(None, description="Длительность в секундах")
    output: Optional[str] = Field(None, description="Вывод команды")
    error_message: Optional[str] = Field(None, description="Сообщение об ошибке")
    exit_code: Optional[int] = Field(None, description="Код завершения")
    
    # Prometheus monitoring fields
    prometheus_value: Optional[str] = Field(None, description="Значение метрики из Prometheus")
    condition_met: Optional[bool] = Field(None, description="Было ли выполнено условие")
    monitoring_device_mac: Optional[str] = Field(None, description="MAC адрес мониторируемого устройства")
    monitoring_metric: Optional[str] = Field(None, description="Название проверенной метрики")


class JobExecutionCreate(JobExecutionBase):
    """Схема для создания выполнения задания"""
    pass


class JobExecutionUpdate(BaseModel):
    """Схема для обновления выполнения задания"""
    status: Optional[str] = Field(None, description="Статус выполнения")
    success: Optional[bool] = Field(None, description="Успешно ли выполнено")
    started_at: Optional[datetime] = Field(None, description="Время начала")
    completed_at: Optional[datetime] = Field(None, description="Время завершения")
    duration: Optional[int] = Field(None, description="Длительность в секундах")
    output: Optional[str] = Field(None, description="Вывод команды")
    error_message: Optional[str] = Field(None, description="Сообщение об ошибке")
    exit_code: Optional[int] = Field(None, description="Код завершения")
    
    # Prometheus monitoring fields
    prometheus_value: Optional[str] = Field(None, description="Значение метрики из Prometheus")
    condition_met: Optional[bool] = Field(None, description="Было ли выполнено условие")
    monitoring_device_mac: Optional[str] = Field(None, description="MAC адрес мониторируемого устройства")
    monitoring_metric: Optional[str] = Field(None, description="Название проверенной метрики")


class JobExecutionResponse(JobExecutionBase):
    """Схема для ответа с выполнением задания"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobWithExecutions(JobResponse):
    """Схема для задания с историей выполнений"""
    executions: List[JobExecutionResponse] = [] 