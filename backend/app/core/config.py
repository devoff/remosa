from pydantic_settings import BaseSettings
from pydantic import PostgresDsn
from typing import Optional

class Settings(BaseSettings):
    # Основные настройки приложения
    PROJECT_NAME: str = "Remosa Monitoring System"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print(f"DEBUG_CONFIG: Loaded DEBUG = {self.DEBUG}")
        print(f"DEBUG_CONFIG: Loaded JWT_SECRET_KEY = {self.JWT_SECRET_KEY}")

    # Настройки базы данных
    POSTGRES_HOST: str
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    
    # Настройки Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_HOST: Optional[str] = None
    REDIS_PORT: Optional[str] = None
    REDIS_DB: Optional[str] = None
    REDIS_PASSWORD: Optional[str] = None

    # Настройки бэкенда
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: str = "8000"
    SECRET_KEY: str
    ALLOWED_ORIGINS: str = '["http://localhost:3000", "http://remosa.ru"]'
    API_URL: str = "http://remosa.ru:8000"
    WS_URL: str = "ws://remosa.ru:8000/ws"
    
    # Настройки JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300

    # Настройки фронтенда (Vite/React)
    VITE_API_URL: str = "http://remosa.ru:8000/api/v1"
    VITE_WS_URL: str = "ws://remosa.ru:8000/ws" # Исправлено на ws://...
    REACT_APP_API_URL: Optional[str] = None # Устарело, но оставляем для совместимости
    REACT_APP_WS_URL: Optional[str] = None # Устарело, но оставляем для совместимости
    NODE_ENV: str = "production"
    GENERATE_SOURCEMAP: str = "false"

    # Настройки SMS шлюза
    SMS_SENDER_ID: Optional[str] = "REMOSA"
    SMS_GATEWAY_URL: Optional[str] = None
    SMS_GATEWAY_API_KEY: Optional[str] = None
    SMS_GATEWAY_PHONE_FORMAT: str = "+7XXXXXXXXXX"

    # Настройки логирования
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Optional[str] = None # Добавляем формат логов

    # Настройки Grafana
    GRAFANA_WEBHOOK_SECRET: Optional[str] = None

    # Настройки CORS
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = '["GET", "POST", "PUT", "DELETE", "OPTIONS"]'
    CORS_ALLOW_HEADERS: str = '["*"]'

    # Настройки Nginx
    NGINX_PORT: str = "80"
    NGINX_SSL_PORT: str = "443"

    # Настройки SMTP (Email)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None

    # Настройки очередей и лимитов
    MAX_RETRY_ATTEMPTS: int = 3
    ALERT_TIMEOUT_SECONDS: int = 300
    SMS_QUEUE_TIMEOUT: int = 60

    # Настройки Python
    PYTHONPATH: Optional[str] = "/app"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        print(f'DEBUG_CONFIG: POSTGRES_HOST is {self.POSTGRES_HOST}')  # Добавляем отладку
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