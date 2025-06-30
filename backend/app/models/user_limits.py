from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class UserLimits(Base):
    __tablename__ = "user_limits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    max_devices = Column(Integer, default=0, nullable=False)
    max_sms_messages = Column(Integer, default=0, nullable=False)
    sms_messages_sent_current_period = Column(Integer, default=0, nullable=False)
    sms_period_start_date = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    # Отношения
    user = relationship("User", back_populates="user_limits")

    __table_args__ = (
        UniqueConstraint('user_id', name='user_limits_user_id_key'),
    ) 