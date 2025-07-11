from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    title: str = Field(..., description="Заголовок уведомления")
    message: str = Field(..., description="Текст уведомления")
    type: str = Field(..., description="Тип уведомления: 'alert', 'error', 'info', 'warning'")

class NotificationCreate(NotificationBase):
    user_id: int = Field(..., description="ID пользователя, которому предназначено уведомление")

class NotificationUpdate(BaseModel):
    read_status: Optional[bool] = Field(None, description="Статус прочитан/не прочитан")

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    read_status: bool = Field(..., description="Статус прочитан/не прочитан")
    created_at: datetime = Field(..., description="Дата и время создания уведомления")
    updated_at: Optional[datetime] = Field(None, description="Дата и время последнего обновления")

    class Config:
        from_attributes = True

class NotificationList(BaseModel):
    items: list[NotificationResponse]
    total: int = Field(..., description="Общее количество уведомлений")
    unread_count: int = Field(..., description="Количество непрочитанных уведомлений")

class UnreadCountResponse(BaseModel):
    unread_count: int = Field(..., description="Количество непрочитанных уведомлений")

class NotificationMarkReadResponse(BaseModel):
    message: str = Field(..., description="Сообщение о результате операции")
    updated_count: int = Field(..., description="Количество обновленных уведомлений") 