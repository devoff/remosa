from typing import Any, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.client import Client as DBClient
from app.schemas.client import ClientResponse

router = APIRouter()

@router.get("/", response_model=List[ClientResponse], summary="Получить все платформы",
            dependencies=[Depends(get_current_user)],
            tags=["Platforms"])
def read_platforms(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список всех платформ (клиентов).
    """
    platforms = db.query(DBClient).offset(skip).limit(limit).all()
    return platforms 