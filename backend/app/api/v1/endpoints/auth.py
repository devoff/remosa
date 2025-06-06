from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, User as UserSchema
from app.schemas.user_limits import UserLimitsCreate
from app.models.user import User as UserModel
from app.models.user_limits import UserLimits as UserLimitsModel
from app.db.session import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_in.password)
    db_user = UserModel(username=user_in.username, email=user_in.email, hashed_password=hashed_password, role=user_in.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Создаем запись в UserLimits для нового пользователя
    user_limits_create = UserLimitsCreate(user_id=db_user.id, max_devices=settings.DEFAULT_MAX_DEVICES_PER_USER, max_sms_messages=settings.DEFAULT_MAX_SMS_PER_USER)
    db_user_limits = UserLimitsModel(**user_limits_create.dict())
    db.add(db_user_limits)
    db.commit()
    db.refresh(db_user_limits)

    return db_user

@router.post("/token")
async def login_for_access_token(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == user_in.username).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"} 