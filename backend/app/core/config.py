from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Remosa Monitoring System"
    REDIS_URL: str = "redis://redis:6379/0"
    SMS_GATEWAY_URL: Optional[str] = None
    SMS_GATEWAY_API_KEY: Optional[str] = None

    # Database settings
    POSTGRES_USER: str = "remosa"
    POSTGRES_PASSWORD: str = "1234567890"
    POSTGRES_HOST: str = "192.168.1.178"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "remosa"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"

settings = Settings()