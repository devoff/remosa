
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db

router = APIRouter()

@router.get("/")
async def get_devices():
    """Get all devices."""
    # Возвращаем тестовые данные пока нет подключения к БД
    return [
        {
            "id": 1,
            "name": "Устройство 1",
            "status": "online",
            "created_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "name": "Устройство 2", 
            "status": "offline",
            "created_at": "2024-01-14T15:45:00Z"
        },
        {
            "id": 3,
            "name": "Устройство 3",
            "status": "warning", 
            "created_at": "2024-01-13T09:15:00Z"
        }
    ]

@router.post("/")
async def create_device():
    """Create a new device."""
    return {"message": "Device created successfully"}
