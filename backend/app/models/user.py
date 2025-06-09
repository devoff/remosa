from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Новые поля для ролей
    role = Column(String, default="user", nullable=False) # Например: "user", "admin", "superuser"
    is_superuser = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # Поле для связи с платформой (или клиентом)
    platform_id = Column(Integer, ForeignKey("clients.id"), nullable=True) # Предполагаем, что client_id в Device связан с clients.id
    
    # Добавим отношение к Client, если нужно
    # client = relationship("Client", back_populates="users") 