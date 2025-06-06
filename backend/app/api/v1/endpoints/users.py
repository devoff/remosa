from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.schemas.user_limits import UserLimits as UserLimitsSchema, UserLimitsUpdate
from app.models.user import User as UserModel
from app.models.user_limits import UserLimits as UserLimitsModel
from app.db.session import get_db
from app.core.security import get_password_hash, verify_password
from app.core.auth import get_current_active_superuser, get_current_active_admin, get_current_active_user
from app.core.config import settings
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_active_admin)])
async def create_user_by_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
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

    user_limits_create = UserLimitsSchema(
        user_id=db_user.id,
        max_devices=settings.DEFAULT_MAX_DEVICES_PER_USER,
        max_sms_messages=settings.DEFAULT_MAX_SMS_PER_USER,
        sms_messages_sent_current_period=0,
        sms_period_start_date=datetime.utcnow()
    )
    db_user_limits = UserLimitsModel(**user_limits_create.dict())
    db.add(db_user_limits)
    db.commit()
    db.refresh(db_user_limits)

    return db_user

@router.get("/", response_model=List[UserSchema], dependencies=[Depends(get_current_active_admin)])
async def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: UserModel = Depends(get_current_active_user)
):
    return current_user

@router.get("/{user_id}", response_model=UserSchema, dependencies=[Depends(get_current_active_admin)])
async def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserSchema, dependencies=[Depends(get_current_active_admin)])
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.username and user_in.username != user.username:
        existing_user = db.query(UserModel).filter(UserModel.username == user_in.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")

    if user_in.email and user_in.email != user.email:
        existing_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    for field, value in user_in.dict(exclude_unset=True).items():
        if field == "password" and value:
            user.hashed_password = get_password_hash(value)
        else:
            setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_active_admin)])
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/{user_id}/limits", response_model=UserLimitsSchema, dependencies=[Depends(get_current_active_admin)])
async def read_user_limits(
    user_id: int,
    db: Session = Depends(get_db)
):
    user_limits = db.query(UserLimitsModel).filter(UserLimitsModel.user_id == user_id).first()
    if not user_limits:
        raise HTTPException(status_code=404, detail="User limits not found")
    return user_limits

@router.put("/{user_id}/limits", response_model=UserLimitsSchema, dependencies=[Depends(get_current_active_admin)])
async def update_user_limits(
    user_id: int,
    limits_in: UserLimitsUpdate,
    db: Session = Depends(get_db)
):
    user_limits = db.query(UserLimitsModel).filter(UserLimitsModel.user_id == user_id).first()
    if not user_limits:
        raise HTTPException(status_code=404, detail="User limits not found")
    
    for field, value in limits_in.dict(exclude_unset=True).items():
        setattr(user_limits, field, value)
    
    db.add(user_limits)
    db.commit()
    db.refresh(user_limits)
    return user_limits 