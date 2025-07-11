from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.schemas.notification import (
    NotificationCreate, 
    NotificationResponse, 
    NotificationList,
    UnreadCountResponse,
    NotificationMarkReadResponse
)
from app.models.user import User
from app.db.session import get_db
from app.core.auth import get_current_user
from app.services.notification_service import NotificationService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=NotificationList)
def get_notifications(
    limit: int = Query(10, description="Максимальное количество уведомлений"),
    unread_only: bool = Query(False, description="Только непрочитанные уведомления"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить уведомления текущего пользователя"""
    logger.info(f"Getting notifications for user {current_user.id}, limit={limit}, unread_only={unread_only}")
    
    notification_service = NotificationService(db)
    notifications = notification_service.get_notifications(
        user_id=current_user.id,
        limit=limit,
        unread_only=unread_only
    )
    
    logger.info(f"Retrieved {len(notifications.items)} notifications for user {current_user.id}")
    return notifications

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить количество непрочитанных уведомлений"""
    logger.info(f"Getting unread count for user {current_user.id}")
    
    notification_service = NotificationService(db)
    unread_count = notification_service.get_unread_count(current_user.id)
    
    logger.info(f"User {current_user.id} has {unread_count.unread_count} unread notifications")
    return unread_count

@router.post("/read-all", response_model=NotificationMarkReadResponse)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Пометить все уведомления как прочитанные"""
    logger.info(f"Marking all notifications as read for user {current_user.id}")
    
    notification_service = NotificationService(db)
    result = notification_service.mark_all_read(current_user.id)
    
    logger.info(f"Marked {result.updated_count} notifications as read for user {current_user.id}")
    return result

@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Пометить одно уведомление как прочитанное"""
    logger.info(f"Marking notification {notification_id} as read for user {current_user.id}")
    
    notification_service = NotificationService(db)
    success = notification_service.mark_notification_read(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    logger.info(f"Notification {notification_id} marked as read for user {current_user.id}")
    return {"message": "Notification marked as read"}

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать уведомление (только для админов)"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create notifications"
        )
    
    logger.info(f"Creating notification for user {notification.user_id} by admin {current_user.id}")
    
    notification_service = NotificationService(db)
    db_notification = notification_service.create_notification(notification)
    
    logger.info(f"Notification {db_notification.id} created successfully")
    return db_notification 