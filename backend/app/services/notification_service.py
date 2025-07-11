from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationList, UnreadCountResponse, NotificationMarkReadResponse
from app.models.user import User

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """Создать новое уведомление"""
        db_notification = Notification(**notification_data.dict())
        self.db.add(db_notification)
        self.db.commit()
        self.db.refresh(db_notification)
        return db_notification

    def get_notifications(
        self, 
        user_id: int, 
        limit: int = 10, 
        unread_only: bool = False
    ) -> NotificationList:
        """Получить уведомления пользователя"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.read_status == False)
        
        # Получаем последние уведомления
        notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()
        
        # Подсчитываем общее количество и непрочитанные
        total = self.db.query(Notification).filter(Notification.user_id == user_id).count()
        unread_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read_status == False
        ).count()
        
        return NotificationList(
            items=notifications,
            total=total,
            unread_count=unread_count
        )

    def get_unread_count(self, user_id: int) -> UnreadCountResponse:
        """Получить количество непрочитанных уведомлений"""
        unread_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read_status == False
        ).count()
        
        return UnreadCountResponse(unread_count=unread_count)

    def mark_notification_read(self, notification_id: int, user_id: int) -> bool:
        """Пометить одно уведомление как прочитанное"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.read_status = True
            self.db.commit()
            return True
        return False

    def mark_all_read(self, user_id: int) -> NotificationMarkReadResponse:
        """Пометить все уведомления пользователя как прочитанные"""
        updated_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read_status == False
        ).update({Notification.read_status: True})
        
        self.db.commit()
        
        return NotificationMarkReadResponse(
            message="All notifications marked as read",
            updated_count=updated_count
        )

    def create_alert_notification(self, user_id: int, alert_title: str, alert_message: str) -> Notification:
        """Создать уведомление на основе алерта"""
        notification_data = NotificationCreate(
            user_id=user_id,
            title=alert_title,
            message=alert_message,
            type="alert"
        )
        return self.create_notification(notification_data)

    def create_system_notification(self, user_id: int, title: str, message: str, notification_type: str = "info") -> Notification:
        """Создать системное уведомление"""
        notification_data = NotificationCreate(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type
        )
        return self.create_notification(notification_data) 