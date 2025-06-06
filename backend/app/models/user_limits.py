from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy.sql import func

class UserLimits(Base):
    __tablename__ = "user_limits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    max_devices = Column(Integer, default=0) # Максимальное количество устройств
    max_sms_messages = Column(Integer, default=0) # Максимальное количество SMS в период
    sms_messages_sent_current_period = Column(Integer, default=0) # Отправлено SMS в текущем периоде
    sms_period_start_date = Column(DateTime(timezone=True), server_default=func.now()) # Дата начала текущего периода SMS

    user = relationship("User", back_populates="user_limits") 