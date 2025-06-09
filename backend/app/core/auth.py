from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.models.user import User as DBUser
from app.core.auth import verify_password

# Настройки JWT
SECRET_KEY = "ВАШ_СЕКРЕТНЫЙ_КЛЮЧ"  # !! В реальном проекте используйте безопасный, случайный ключ из .env !!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Время жизни токена доступа

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token") # Путь к эндпоинту для получения токена

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие открытого пароля хешированному."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Хеширует пароль."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Создает JWT токен доступа."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Декодирует JWT токен и проверяет его валидность."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Зависимость для получения текущего пользователя
# (Пока не будем реализовывать полную логику получения пользователя из БД,
# это будет сделано при создании эндпоинтов)
async def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Извлекает payload из токена для текущего пользователя."""
    return decode_token(token)

def authenticate_user(db: Session, username: str, password: str) -> Optional[DBUser]:
    """
    Аутентифицирует пользователя по имени пользователя и паролю.
    Возвращает объект пользователя из БД, если аутентификация успешна, иначе None.
    """
    user = db.query(DBUser).filter(DBUser.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# ВНИМАНИЕ: Замените "ВАШ_СЕКРЕТНЫЙ_КЛЮЧ" на реальный, безопасный ключ!
# В продакшене используйте переменную окружения. 