from sqlalchemy.orm import Session
from app.models.client import Client
from app.schemas.client import ClientCreate

class ClientService:
    @staticmethod
    async def get_clients(db: Session):
        return []

    @staticmethod
    async def create_client(db: Session, client: ClientCreate):
        return {"id": 1, "name": client.name, "email": client.email} 