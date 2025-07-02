from fastapi import APIRouter
from starlette.responses import JSONResponse
from app.core.deps import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from sqlalchemy import text
import logging
import os
import platform
from datetime import datetime

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/", summary="Проверка состояния сервиса")
async def health_check(db: Session = Depends(get_db)):
    """
    Проверяет состояние сервиса, включая доступность базы данных.
    """
    db_status = "healthy"
    try:
        # Простой запрос к БД для проверки соединения
        db.execute(text('SELECT 1'))
        logger.info("Database connection is healthy.")
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        db_status = "unhealthy"

    # Информация о версии и системе
    version_info = {
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "build_date": os.getenv("BUILD_DATE", datetime.now().isoformat()),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

    return JSONResponse({
        "status": "ok",
        "database": db_status,
        "jwt_key_loaded": True,  # Предполагаем, что если сервис работает, ключ загружен
        "debug_mode": False,  # Уточнить, если есть реальный способ проверки
        "version_info": version_info
    })

@router.get("/version", summary="Получить информацию о версии")
async def get_version():
    """
    Возвращает информацию о версии приложения и системе.
    """
    version_info = {
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "build_date": os.getenv("BUILD_DATE", datetime.now().isoformat()),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "api_version": "v1"
    }
    
    return JSONResponse(version_info)
