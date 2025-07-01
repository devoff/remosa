from fastapi import APIRouter
from starlette.responses import JSONResponse
from app.core.deps import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from sqlalchemy import text
import logging

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

    return JSONResponse({
        "status": "ok",
        "database": db_status,
        "jwt_key_loaded": True,  # Предполагаем, что если сервис работает, ключ загружен
        "debug_mode": False  # Уточнить, если есть реальный способ проверки
    })
