from datetime import datetime
from pydantic import BaseModel

class UserLimitsBase(BaseModel):
    max_devices: int
    max_sms_messages: int

class UserLimitsCreate(UserLimitsBase):
    user_id: int

class UserLimitsUpdate(UserLimitsBase):
    sms_messages_sent_current_period: int | None = None
    sms_period_start_date: datetime | None = None

class UserLimitsInDBBase(UserLimitsBase):
    id: int
    user_id: int
    sms_messages_sent_current_period: int
    sms_period_start_date: datetime

    class Config:
        from_attributes = True

class UserLimits(UserLimitsInDBBase):
    pass 