from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLAlchemyEnum, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class TaskExecutionStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskExecution(Base):
    __tablename__ = "task_executions"

    id = Column(Integer, primary_key=True, index=True)
    task_template_id = Column(Integer, ForeignKey("task_templates.id"), nullable=False)
    
    # Информация о срабатывании
    triggered_at = Column(DateTime(timezone=True), nullable=False)
    triggered_by_query = Column(Text, nullable=False)  # PromQL запрос, который сработал
    triggered_value = Column(Float, nullable=False)  # Значение, которое вызвало срабатывание
    
    # Статус выполнения
    status = Column(SQLAlchemyEnum(TaskExecutionStatus), default=TaskExecutionStatus.PENDING, nullable=False)
    
    # Устройства, затронутые выполнением
    devices_affected = Column(JSON, nullable=True)  # Список устройств, на которых выполнялось действие
    
    # Результат выполнения
    execution_result = Column(JSON, nullable=True)  # Детальный результат выполнения
    error_message = Column(Text, nullable=True)  # Сообщение об ошибке, если есть
    
    # Временные метки выполнения
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Retry информация
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Отношения
    task_template = relationship("TaskTemplate", back_populates="executions") 