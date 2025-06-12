from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.users import UserInDB
from app.models.user import User
from app.db.session import get_db
from passlib.context import CryptContext
import logging
import sys
from app.core.config import settings

logger = logging.getLogger(__name__)

# Убедимся, что у логгера app.core.auth есть обработчик, чтобы логи всегда выводились
if not any(isinstance(handler, logging.StreamHandler) for handler in logger.handlers):
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO) # Устанавливаем уровень INFO для этого логгера

# Исправлено: правильный tokenUrl для наших API маршрутов
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
logger.info(f"OAuth2 scheme configured with tokenUrl: /api/v1/auth/token")
SECRET_KEY = settings.JWT_SECRET_KEY # Возвращаем использование ключа из настроек
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

logger.info(f"Using SECRET_KEY from settings for JWT: {SECRET_KEY}") # Обновленное сообщение
logger.info(f"JWT_ALGORITHM used: {ALGORITHM}")
logger.info(f"ACCESS_TOKEN_EXPIRE_MINUTES set to: {ACCESS_TOKEN_EXPIRE_MINUTES}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    """Функция аутентификации пользователя с отладочными логами"""
    logger.info(f"Attempting to authenticate user: {username}")
    
    # Ищем пользователя по email (у модели User нет поля username, только email)
    user = db.query(User).filter(User.email == username).first()
    
    if not user:
        logger.warning(f"User not found: {username}")
        return None
    
    logger.info(f"User found: {user.email} (ID: {user.id})")
    
    # Проверяем пароль
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Invalid password for user: {username}")
        return None
    
    logger.info(f"User successfully authenticated: {username}")
    return user

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Создание JWT токена с возможностью задать время истечения"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    logger.info(f"Creating token with data: {to_encode}")
    logger.info(f"Token will expire at: {expire}")
    logger.info(f"DEBUG_AUTH: Encoding with SECRET_KEY = {SECRET_KEY[:10]}... and ALGORITHM = {ALGORITHM}")
    
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"Generated JWT token: {token[:30]}...")
    return token

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    logger.info(f"Received token in get_current_user: {token[:30]}...") # Логируем часть токена
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Decoded payload: {payload}")
        user_id = payload.get("sub")
        logger.info(f"Extracted user_id from token: {user_id}")
        if user_id is None:
            logger.warning("User ID is None in token payload.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: User ID missing",
            )
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        logger.info(f"Successfully retrieved user: {user.id}")
        return user
    except JWTError as e:
        logger.error(f"JWT error during token decoding/validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )
    except Exception as e:
        logger.critical(f"Unexpected error in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )