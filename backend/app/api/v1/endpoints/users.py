from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.users import UserCreate, UserInDB, UserUpdate, PlatformRole
from app.models.user import User
from app.db.session import get_db
from app.core.auth import get_password_hash, get_current_user
from datetime import datetime
import logging
from app.utils.audit import log_audit
from app.models.platform_user import PlatformUser

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Attempting to create user: {user.email}")
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    log_audit(db, user_id=None, action="create_user", platform_id=None, details=f"Создан пользователь {db_user.email}")
    logger.info(f"User created: {db_user.email}")
    return db_user

@router.get("/", response_model=list[UserInDB])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Attempting to retrieve all users. Skip: {skip}, Limit: {limit}")
    users = db.query(User).offset(skip).limit(limit).all()
    logger.info(f"Retrieved {len(users)} users.")
    return users

@router.get("/me", response_model=UserInDB)
def read_current_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Получаем все platform_roles пользователя
    platform_users = db.query(PlatformUser).filter(PlatformUser.user_id == current_user.id).all()
    platform_roles = [PlatformRole(platform_id=pu.platform_id, role=pu.role) for pu in platform_users]
    # Преобразуем current_user в dict и добавляем platform_roles
    user_dict = current_user.__dict__.copy()
    user_dict['platform_roles'] = platform_roles
    return user_dict

@router.put("/{user_id}", response_model=UserInDB)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Attempting to update user ID: {user_id}")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id != current_user.id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_data = user.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    log_audit(db, user_id=current_user.id, action="update_user", platform_id=None, details=f"Обновлен пользователь {db_user.email}")
    logger.info(f"User updated: {db_user.email}")
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Attempting to delete user ID: {user_id}")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id != current_user.id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    log_audit(db, user_id=current_user.id, action="delete_user", platform_id=None, details=f"Удален пользователь {db_user.email}")
    db.delete(db_user)
    db.commit()
    logger.info(f"User deleted: {db_user.email}") 