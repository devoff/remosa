from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import authenticate_user, create_access_token, get_password_hash
from app.db.session import get_db
from app.schemas.token import Token
from app.schemas.user import User, UserCreate, UserLogin
from app.models.user import User as DBUser

router = APIRouter()

# Используем стандартную get_db функцию вместо неправильной get_db_session

@router.post("/register", response_model=User)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    existing_user_by_email = db.query(DBUser).filter(DBUser.email == user_in.email).first()
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email уже зарегистрирован."
        )

    hashed_password = get_password_hash(user_in.password)
    
    db_user = DBUser(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True,
        role=getattr(user_in, 'role', 'user'),
        platform_id=getattr(user_in, 'platform_id', None)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    user_credentials: UserLogin, db: Session = Depends(get_db)
) -> Any:
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "platform_id": user.platform_id, "user_id": user.id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"} 