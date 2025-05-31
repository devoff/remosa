from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional, Dict
from sqlalchemy.orm import Session

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    message = Column(String)
    level = Column(String, default="info")
    command = Column(String, nullable=True)
    status = Column(String, nullable=True)
    response = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    execution_time = Column(DateTime(timezone=True), nullable=True)
    extra_data = Column(String, nullable=True)
    
    device = relationship("Device", back_populates="command_logs")

    @staticmethod
    def log_command(
        db: Session,
        device_id: int,
        command: str,
        status: str,
        response: Optional[str] = None,
        execution_time: Optional[float] = None,
        extra_data: Optional[Dict] = None
    ) -> "Log":
        """Логирование выполнения команды"""
        log = Log(
            device_id=device_id,
            message=f"Command {command}: {status}",
            level="info" if status == "success" else "error",
            command=command,
            response=response,
            execution_time=execution_time,
            extra_data=extra_data or {}
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log 