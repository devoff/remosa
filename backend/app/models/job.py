from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Job(Base):
    """Модель для хранения информации о заданиях"""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    command = Column(Text, nullable=False)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    schedule = Column(String(100), nullable=True)  # cron expression
    timeout = Column(Integer, default=300)  # timeout in seconds
    retry_count = Column(Integer, default=3)
    retry_delay = Column(Integer, default=60)  # delay in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    platform = relationship("Platform", back_populates="jobs")
    device = relationship("Device", back_populates="jobs")
    executions = relationship("JobExecution", back_populates="job", cascade="all, delete-orphan")


class JobExecution(Base):
    """Модель для хранения информации о выполнении заданий"""
    __tablename__ = "job_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, running, completed, failed
    success = Column(Boolean, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, nullable=True)  # duration in seconds
    output = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    exit_code = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="executions") 