import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Явно преобразуем в строку, если нужно
database_url = str(settings.SQLALCHEMY_DATABASE_URI)
print(f'DEBUG_DATABASE: Full database URL is {database_url}')  # Существующая отладка

try:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    engine.connect()  # Пытаемся подключиться для проверки
    print(f'DEBUG_ENGINE: Connection to database successful')  # Успешно
except sqlalchemy.exc.OperationalError as e:
    print(f'DEBUG_ENGINE_ERROR: Connection failed: {e}')  # Ошибка подключения

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()