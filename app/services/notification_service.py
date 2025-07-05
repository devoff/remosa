import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """Сервис для отправки уведомлений"""
    
    def __init__(self):
        self.notification_methods = {
            'email': self.send_email_notification,
            'webhook': self.send_webhook_notification,
            'database': self.save_database_notification,
            'telegram': self.send_telegram_notification
        }
    
    async def send_notification(self, message: str, recipients: List[str] = None, 
                              job_id: Optional[int] = None, 
                              notification_type: str = 'database') -> Dict[str, Any]:
        """Отправка уведомления"""
        try:
            # Определяем получателей
            if not recipients:
                recipients = await self.get_default_recipients()
            
            # Выбираем метод отправки
            if notification_type in self.notification_methods:
                result = await self.notification_methods[notification_type](
                    message=message,
                    recipients=recipients,
                    job_id=job_id
                )
            else:
                # По умолчанию сохраняем в базу
                result = await self.save_database_notification(
                    message=message,
                    recipients=recipients,
                    job_id=job_id
                )
            
            logger.info(f"Уведомление отправлено: {notification_type}, получатели: {len(recipients)}")
            return result
            
        except Exception as e:
            logger.error(f"Ошибка при отправке уведомления: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def get_default_recipients(self) -> List[str]:
        """Получение списка получателей по умолчанию"""
        try:
            db = next(get_db())
            # Получаем superadmin пользователей
            superadmins = db.query(User).filter(User.is_superadmin == True).all()
            recipients = [user.email for user in superadmins if user.email]
            db.close()
            return recipients
        except Exception as e:
            logger.error(f"Ошибка при получении получателей: {e}")
            return []
    
    async def save_database_notification(self, message: str, recipients: List[str] = None,
                                       job_id: Optional[int] = None) -> Dict[str, Any]:
        """Сохранение уведомления в базу данных"""
        try:
            db = next(get_db())
            
            notification = Notification(
                message=message,
                recipients=recipients or [],
                job_id=job_id,
                created_at=datetime.utcnow(),
                status='sent'
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            db.close()
            
            return {
                'success': True,
                'notification_id': notification.id,
                'method': 'database',
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении уведомления в БД: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'database',
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def send_email_notification(self, message: str, recipients: List[str] = None,
                                    job_id: Optional[int] = None) -> Dict[str, Any]:
        """Отправка уведомления по email"""
        try:
            if not recipients:
                return {
                    'success': False,
                    'error': 'Нет получателей для email',
                    'method': 'email',
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            # Здесь должна быть интеграция с email сервисом
            # Пока возвращаем заглушку
            logger.info(f"Email уведомление отправлено: {message[:50]}... получателям: {recipients}")
            
            return {
                'success': True,
                'method': 'email',
                'recipients': recipients,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Ошибка при отправке email: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'email',
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def send_webhook_notification(self, message: str, recipients: List[str] = None,
                                      job_id: Optional[int] = None) -> Dict[str, Any]:
        """Отправка уведомления через webhook"""
        try:
            webhook_url = settings.NOTIFICATION_WEBHOOK_URL
            if not webhook_url:
                return {
                    'success': False,
                    'error': 'Webhook URL не настроен',
                    'method': 'webhook',
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            webhook_data = {
                'message': message,
                'recipients': recipients or [],
                'job_id': job_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(webhook_url, json=webhook_data)
                response.raise_for_status()
            
            return {
                'success': True,
                'method': 'webhook',
                'webhook_url': webhook_url,
                'status_code': response.status_code,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Ошибка при отправке webhook: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'webhook',
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def send_telegram_notification(self, message: str, recipients: List[str] = None,
                                       job_id: Optional[int] = None) -> Dict[str, Any]:
        """Отправка уведомления в Telegram"""
        try:
            bot_token = settings.TELEGRAM_BOT_TOKEN
            chat_id = settings.TELEGRAM_CHAT_ID
            
            if not bot_token or not chat_id:
                return {
                    'success': False,
                    'error': 'Telegram настройки не сконфигурированы',
                    'method': 'telegram',
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            telegram_data = {
                'chat_id': chat_id,
                'text': f"🔔 Remosa Notification\n\n{message}",
                'parse_mode': 'HTML'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(telegram_url, json=telegram_data)
                response.raise_for_status()
            
            return {
                'success': True,
                'method': 'telegram',
                'chat_id': chat_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Ошибка при отправке Telegram уведомления: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'telegram',
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def get_notifications(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Получение списка уведомлений"""
        try:
            db = next(get_db())
            notifications = db.query(Notification).order_by(
                Notification.created_at.desc()
            ).offset(offset).limit(limit).all()
            
            result = []
            for notification in notifications:
                result.append({
                    'id': notification.id,
                    'message': notification.message,
                    'recipients': notification.recipients,
                    'job_id': notification.job_id,
                    'status': notification.status,
                    'created_at': notification.created_at.isoformat() if notification.created_at else None
                })
            
            db.close()
            return result
            
        except Exception as e:
            logger.error(f"Ошибка при получении уведомлений: {e}")
            return []
    
    async def mark_notification_as_read(self, notification_id: int) -> bool:
        """Отметить уведомление как прочитанное"""
        try:
            db = next(get_db())
            notification = db.query(Notification).filter(Notification.id == notification_id).first()
            
            if notification:
                notification.status = 'read'
                db.commit()
                db.close()
                return True
            
            db.close()
            return False
            
        except Exception as e:
            logger.error(f"Ошибка при отметке уведомления как прочитанного: {e}")
            return False

# Глобальный экземпляр сервиса
notification_service = NotificationService() 