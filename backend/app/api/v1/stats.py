
from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard statistics."""
    return {
        "totalAlerts": 12,
        "activeDevices": 8,
        "totalClients": 25,
        "successRate": 94.5
    }
