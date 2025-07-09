from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.services.sms_poller import poll_sms_gateway
import asyncio
import logging
import os
import sys
from datetime import datetime
from contextlib import asynccontextmanager

from app.db.session import get_db
from app.db.base import Base
from app.db.session import engine

# Configure a logger for this module
logger = logging.getLogger(__name__)

# Get the root logger
root_logger = logging.getLogger()

# Set logging level for the root logger based on LOG_LEVEL
logging.getLogger().setLevel(settings.LOG_LEVEL)

# Ensure root logger has a StreamHandler if none exists
if not any(isinstance(handler, logging.StreamHandler) for handler in root_logger.handlers):
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

# Дублирующиеся определения базы данных удалены для предотвращения конфликтов
# Используются определения из app.db.session

# Фоновая задача для опроса SMS шлюза
async def start_sms_polling_background_task():
    while True:
        try:
            await poll_sms_gateway()
            await asyncio.sleep(60) # Опрос каждые 60 секунд
        except Exception as e:
            logger.error(f"Ошибка в SMS polling: {e}")
            await asyncio.sleep(60)  # Ждем перед повторной попыткой

# Определяем lifespan функцию ДО создания приложения FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.start_time = datetime.now()  # Сохраняем время старта
    logger.info("=== ЗАПУСК ПРИЛОЖЕНИЯ ===")
    logger.info(f"Время запуска: {app.state.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=== МАРШРУТЫ ПРИЛОЖЕНИЯ ===")
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            logger.info(f"Registered route: {route.path} - {list(route.methods)}")
    logger.info("=== КОНЕЦ СПИСКА МАРШРУТОВ ===")
    logger.info(f"Используемый JWT_SECRET_KEY: {settings.JWT_SECRET_KEY[:10]}...")
    logger.info(f"Database URI: {settings.SQLALCHEMY_DATABASE_URI}")
    
    # Запуск фоновой задачи для опроса SMS шлюза
    logger.info("Запуск фоновой задачи опроса SMS шлюза...")
    sms_task = asyncio.create_task(start_sms_polling_background_task())
    
    yield
    
    # Shutdown
    logger.info("=== ЗАВЕРШЕНИЕ ПРИЛОЖЕНИЯ ===")
    sms_task.cancel()
    try:
        await sms_task
    except asyncio.CancelledError:
        logger.info("SMS polling task cancelled successfully")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan  # Используем новый lifespan вместо on_event
)

# Настройка CORS (исправлено для безопасности)
import json
allowed_origins = json.loads(settings.ALLOWED_ORIGINS) if isinstance(settings.ALLOWED_ORIGINS, str) else settings.ALLOWED_ORIGINS
logger.info(f"CORS allowed origins: {allowed_origins}")

# Middleware для логирования запросов (для отладки Mixed Content)
@app.middleware("http")
async def log_requests(request, call_next):
    import time
    start_time = time.time()
    
    # Логируем входящий запрос
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Scheme: {request.url.scheme}")
    logger.info(f"Host: {request.url.hostname}")
    logger.info(f"X-Forwarded-Proto: {request.headers.get('x-forwarded-proto', 'NOT_SET')}")
    
    response = await call_next(request)
    
    # Логируем ответ
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} for {request.method} {request.url} in {process_time:.4f}s")
    
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Дублированные определения lifespan и start_sms_polling_background_task удалены выше

@app.get("/health")
async def health_check():
    """Health check endpoint с отладочной информацией"""
    logger.info("Health check запрос получен")
    try:
        # Проверяем подключение к базе данных
        from app.db.session import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"unhealthy: {str(e)}"
    
    health_info = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "jwt_key_loaded": bool(settings.JWT_SECRET_KEY),
        "debug_mode": settings.DEBUG
    }
    
    logger.info(f"Health check response: {health_info}")
    return health_info