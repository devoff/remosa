import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.exporter import Exporter, ExporterStatus
from app.models.exporter_configuration import ExporterConfiguration
from app.core.audit import log_audit

logger = logging.getLogger(__name__)

class ExporterService:
    def __init__(self):
        self.logger = logger
    
    def get_all_exporters(self, db: Session) -> List[Exporter]:
        """Получить все экспортеры"""
        self.logger.info("Запрос на получение всех экспортеров")
        exporters = db.query(Exporter).all()
        self.logger.info(f"Найдено {len(exporters)} экспортеров")
        return exporters
    
    def get_exporter_by_id(self, db: Session, exporter_id: int) -> Optional[Exporter]:
        """Получить экспортер по ID"""
        self.logger.info(f"Запрос на получение экспортера с ID: {exporter_id}")
        exporter = db.query(Exporter).filter(Exporter.id == exporter_id).first()
        if exporter:
            self.logger.info(f"Экспортер найден: {exporter.name} (ID: {exporter.id})")
        else:
            self.logger.warning(f"Экспортер с ID {exporter_id} не найден")
        return exporter
    
    def get_active_exporters(self, db: Session) -> List[Exporter]:
        """Получить активные экспортеры"""
        self.logger.info("Запрос на получение активных экспортеров")
        exporters = db.query(Exporter).filter(Exporter.status == ExporterStatus.ACTIVE).all()
        self.logger.info(f"Найдено {len(exporters)} активных экспортеров")
        return exporters
    
    def start_exporter(self, db: Session, exporter_id: int, user_id: int) -> bool:
        """Запустить экспортер"""
        self.logger.info(f"Попытка запуска экспортера ID: {exporter_id}")
        
        exporter = self.get_exporter_by_id(db, exporter_id)
        if not exporter:
            self.logger.error(f"Экспортер с ID {exporter_id} не найден")
            return False
        
        try:
            # Обновляем статус
            exporter.status = ExporterStatus.ACTIVE
            exporter.container_status = "running"
            exporter.updated_at = datetime.utcnow()
            
            # TODO: Здесь будет логика запуска Docker контейнера
            self.logger.info(f"Экспортер {exporter.name} (ID: {exporter_id}) запущен")
            
            db.commit()
            
            # Логируем аудит
            log_audit(db, action="start_exporter", user_id=user_id, 
                     platform_id=exporter.platform_id, 
                     details=f"Запущен экспортер: {exporter.name}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка при запуске экспортера {exporter_id}: {e}")
            db.rollback()
            return False
    
    def stop_exporter(self, db: Session, exporter_id: int, user_id: int) -> bool:
        """Остановить экспортер"""
        self.logger.info(f"Попытка остановки экспортера ID: {exporter_id}")
        
        exporter = self.get_exporter_by_id(db, exporter_id)
        if not exporter:
            self.logger.error(f"Экспортер с ID {exporter_id} не найден")
            return False
        
        try:
            # Обновляем статус
            exporter.status = ExporterStatus.INACTIVE
            exporter.container_status = "stopped"
            exporter.updated_at = datetime.utcnow()
            
            # TODO: Здесь будет логика остановки Docker контейнера
            self.logger.info(f"Экспортер {exporter.name} (ID: {exporter_id}) остановлен")
            
            db.commit()
            
            # Логируем аудит
            log_audit(db, action="stop_exporter", user_id=user_id, 
                     platform_id=exporter.platform_id, 
                     details=f"Остановлен экспортер: {exporter.name}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка при остановке экспортера {exporter_id}: {e}")
            db.rollback()
            return False
    
    def update_exporter_metrics(self, db: Session, exporter_id: int, metrics_count: int, 
                              success: bool = True, error_message: str = None) -> bool:
        """Обновить метрики экспортера"""
        self.logger.info(f"Обновление метрик для экспортера ID: {exporter_id}")
        
        exporter = self.get_exporter_by_id(db, exporter_id)
        if not exporter:
            self.logger.error(f"Экспортер с ID {exporter_id} не найден")
            return False
        
        try:
            exporter.last_metrics_count = metrics_count
            exporter.updated_at = datetime.utcnow()
            
            if success:
                exporter.last_successful_collection = datetime.utcnow()
                exporter.last_error_message = None
                self.logger.info(f"Экспортер {exporter.name} успешно собрал {metrics_count} метрик")
            else:
                exporter.last_error_message = error_message
                self.logger.warning(f"Экспортер {exporter.name} завершился с ошибкой: {error_message}")
            
            db.commit()
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка при обновлении метрик экспортера {exporter_id}: {e}")
            db.rollback()
            return False
    
    def get_exporter_stats(self, db: Session) -> Dict[str, Any]:
        """Получить статистику экспортеров"""
        self.logger.info("Запрос статистики экспортеров")
        
        try:
            total_exporters = db.query(Exporter).count()
            active_exporters = db.query(Exporter).filter(Exporter.status == ExporterStatus.ACTIVE).count()
            
            # Получаем время последней синхронизации
            latest_exporter = db.query(Exporter).order_by(Exporter.last_successful_collection.desc()).first()
            last_sync = None
            if latest_exporter and latest_exporter.last_successful_collection:
                last_sync = latest_exporter.last_successful_collection.isoformat()
            
            stats = {
                "total_exporters": total_exporters,
                "active_exporters": active_exporters,
                "total_devices": 0,  # TODO: Реальная статистика устройств
                "online_devices": 0,
                "offline_devices": 0,
                "last_sync": last_sync
            }
            
            self.logger.info(f"Статистика экспортеров: {stats}")
            return stats
            
        except Exception as e:
            self.logger.error(f"Ошибка при получении статистики экспортеров: {e}")
            return {
                "total_exporters": 0,
                "active_exporters": 0,
                "total_devices": 0,
                "online_devices": 0,
                "offline_devices": 0,
                "last_sync": None
            }
    
    def check_exporter_health(self, db: Session, exporter_id: int) -> Dict[str, Any]:
        """Проверить состояние экспортера"""
        self.logger.info(f"Проверка состояния экспортера ID: {exporter_id}")
        
        exporter = self.get_exporter_by_id(db, exporter_id)
        if not exporter:
            return {"status": "not_found", "message": "Экспортер не найден"}
        
        health_info = {
            "id": exporter.id,
            "name": exporter.name,
            "status": exporter.status.value,
            "container_status": exporter.container_status,
            "last_metrics_count": exporter.last_metrics_count,
            "last_successful_collection": exporter.last_successful_collection.isoformat() if exporter.last_successful_collection else None,
            "last_error_message": exporter.last_error_message,
            "is_healthy": exporter.status == ExporterStatus.ACTIVE and exporter.container_status == "running"
        }
        
        self.logger.info(f"Состояние экспортера {exporter.name}: {health_info}")
        return health_info

# Создаем глобальный экземпляр сервиса
exporter_service = ExporterService() 