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

# Map string levels to logging constants
LOGGING_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

# Configure logging using the level from settings
logging.basicConfig(level=LOGGING_LEVELS.get(settings.LOG_LEVEL.upper(), logging.INFO))

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене нужно указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Фоновая задача для опроса SMS шлюза
async def start_sms_polling_background_task():
    while True:
        await poll_sms_gateway()
        await asyncio.sleep(60) # Опрос каждые 60 секунд

@app.on_event("startup")
async def startup_event():
    logger.info("Запуск фоновой задачи опроса SMS шлюза...")
    asyncio.create_task(start_sms_polling_background_task())

@app.get("/health")
async def health_check():
    return {"status": "ok"}