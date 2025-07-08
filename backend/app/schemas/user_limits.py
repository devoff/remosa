from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserLimitsBase(BaseModel):
    max_devices: int = 0
    max_sms_messages: int = 0
    sms_messages_sent_current_period: int = 0
    sms_period_start_date: datetime


class UserLimitsCreate(UserLimitsBase):
    user_id: int


class UserLimitsUpdate(BaseModel):
    max_devices: Optional[int] = None
    max_sms_messages: Optional[int] = None
    sms_messages_sent_current_period: Optional[int] = None
    sms_period_start_date: Optional[datetime] = None


class UserLimits(UserLimitsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True 