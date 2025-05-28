from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Remosa Monitoring System"
    DATABASE_URL: str
    REDIS_URL: str = "redis://redis:6379/0"
    SMS_GATEWAY_URL: Optional[str] = None
    SMS_GATEWAY_API_KEY: Optional[str] = None
    
    # Database settings
    POSTGRES_USER: str = "remosa"
    POSTGRES_PASSWORD: str = "1234567890"
    POSTGRES_HOST: str = "192.168.1.178"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "remosa"
    
    class Config:
        env_file = ".env"

settings = Settings() 