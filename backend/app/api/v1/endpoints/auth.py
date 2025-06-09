from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import authenticate_user, create_access_token, get_password_hash
from app.db.session import get_db
from app.schemas.token import Token
from app.schemas.user import User, UserCreate
from app.models.user import User as DBUser

router = APIRouter()

def get_db_session():
    db = get_db()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=User)
def register_user(user_in: UserCreate, db: Session = Depends(get_db_session)) -> Any:
    existing_user_by_username = db.query(DBUser).filter(DBUser.username == user_in.username).first()
    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя пользователя уже зарегистрировано."
        )
    existing_user_by_email = db.query(DBUser).filter(DBUser.email == user_in.email).first()
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email уже зарегистрирован."
        )

    hashed_password = get_password_hash(user_in.password)
    
    db_user = DBUser(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True,
        role=user_in.role,
        is_superuser=user_in.is_superuser,
        is_admin=user_in.is_admin,
        platform_id=user_in.platform_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db_session)
) -> Any:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "is_superuser": user.is_superuser, "is_admin": user.is_admin, "platform_id": user.platform_id, "user_id": user.id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"} 