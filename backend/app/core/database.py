from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Явно преобразуем в строку, если нужно
database_url = str(settings.SQLALCHEMY_DATABASE_URI)

engine = create_engine(
    database_url,
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