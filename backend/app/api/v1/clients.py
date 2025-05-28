from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.client import ClientCreate, ClientResponse
from app.services.client import ClientService

router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
async def get_clients(db: Session = Depends(get_db)):
    """Get all clients."""
    return []

@router.post("/", response_model=ClientResponse)
async def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    """Create a new client."""
    return {"id": 1, "name": "Test Client", "email": "test@example.com"} 