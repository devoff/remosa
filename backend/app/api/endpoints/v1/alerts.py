from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from remosa.database.models import Alert
from remosa.database.database import get_db

router = APIRouter()

@router.get('/', response_model=List[dict])
def get_alerts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    alerts = db.query(Alert).offset(skip).limit(limit).all()
    return [{
        'id': alert.id,
        'title': alert.title,
        'message': alert.message,
        'severity': alert.severity,
        'timestamp': alert.timestamp,
        'external_id': alert.external_id,
        'details': alert.details  # Ensure details are included
    } for alert in alerts] 