from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLAlchemyEnum, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class TaskActionType(enum.Enum):
    DEVICE_REBOOT = "device_reboot"
    DEVICE_RESTART = "device_restart"
    CUSTOM_COMMAND = "custom_command"
    SMS_NOTIFICATION = "sms_notification"

class TaskThresholdOperator(enum.Enum):
    GREATER_THAN = ">"
    LESS_THAN = "<"
    EQUALS = "=="
    NOT_EQUALS = "!="
    GREATER_EQUAL = ">="
    LESS_EQUAL = "<="

class TaskTemplate(Base):
    __tablename__ = "task_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Привязка к платформе и экспортеру
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    exporter_id = Column(Integer, ForeignKey("exporters.id"), nullable=True)  # Может быть null для глобальных заданий
    
    # Условия срабатывания
    prometheus_query = Column(Text, nullable=False)  # PromQL запрос для проверки условий
    threshold_operator = Column(SQLAlchemyEnum(TaskThresholdOperator), nullable=False)
    threshold_value = Column(Float, nullable=False)
    evaluation_window = Column(String(20), default="5m")  # Окно оценки (5m, 1h, etc)
    
    # Действия
    action_type = Column(SQLAlchemyEnum(TaskActionType), nullable=False)
    target_selector = Column(Text, nullable=True)  # Селектор устройств для действия
    command_template_id = Column(Integer, ForeignKey("command_templates.id"), nullable=True)
    
    # Настройки выполнения
    enabled = Column(Boolean, default=True, nullable=False)
    cooldown_period = Column(String(20), default="1h")  # Период между повторными выполнениями
    max_retries = Column(Integer, default=3)
    retry_delay = Column(String(20), default="5m")  # Задержка между попытками
    
    # Статистика
    execution_count = Column(Integer, default=0)  # Количество выполнений
    last_execution = Column(DateTime(timezone=True), nullable=True)
    last_success = Column(DateTime(timezone=True), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Отношения
    platform = relationship("Platform", back_populates="task_templates")
    exporter = relationship("Exporter", back_populates="task_templates")
    command_template = relationship("CommandTemplate")
    executions = relationship("TaskExecution", back_populates="task_template") 