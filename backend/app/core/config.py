from pydantic_settings import BaseSettings
from pydantic import PostgresDsn
from typing import Optional

class Settings(BaseSettings):
    # Основные настройки приложения
    PROJECT_NAME: str = "Remosa Monitoring System"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Настройки базы данных
    POSTGRES_HOST: str
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    
    # Настройки Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Настройки SMS шлюза
    SMS_GATEWAY_URL: Optional[str] = None
    SMS_GATEWAY_API_KEY: Optional[str] = None
    SMS_GATEWAY_PHONE_FORMAT: str = "+7XXXXXXXXXX"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/"
            f"{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        case_sensitive = False

# Создаем экземпляр настроек один раз
settings = Settings()