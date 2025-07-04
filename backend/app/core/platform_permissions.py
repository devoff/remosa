from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.platform_user import PlatformUser
from app.models.user import User

def get_current_platform_role(platform_id: int, user_id: int, db: Session = Depends(get_db)):
    pu = db.query(PlatformUser).filter_by(platform_id=platform_id, user_id=user_id).first()
    if not pu:
        raise HTTPException(status_code=403, detail="Нет доступа к платформе")
    return pu.role

def require_platform_role(platform_id: int, user_id: int, allowed_roles: list[str], db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.role == 'superadmin':
        return 'superadmin'
    role = get_current_platform_role(platform_id, user_id, db)
    if role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return role 