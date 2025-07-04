import sqlalchemy
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base

# Настраиваем логгер для базы данных
logger = logging.getLogger(__name__)

# Явно преобразуем в строку, если нужно
database_url = str(settings.SQLALCHEMY_DATABASE_URI)
logger.info(f'DATABASE: Full database URL is {database_url}')
logger.info(f'DATABASE: PostgreSQL host: {settings.POSTGRES_HOST}')
logger.info(f'DATABASE: PostgreSQL port: {settings.POSTGRES_PORT}')
logger.info(f'DATABASE: PostgreSQL database: {settings.POSTGRES_DB}')
logger.info(f'DATABASE: PostgreSQL user: {settings.POSTGRES_USER}')

try:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=(settings.LOG_LEVEL == 'DEBUG')  # Включаем SQL логи только если DEBUG
    )
    # Пытаемся подключиться для проверки
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        logger.info(f'DATABASE: Connection successful. PostgreSQL version: {version}')
except sqlalchemy.exc.OperationalError as e:
    logger.error(f'DATABASE: Connection failed: {e}')
    raise
except Exception as e:
    logger.error(f'DATABASE: Unexpected error: {e}')
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()