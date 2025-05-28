from fastapi import APIRouter
from .alerts import router as alerts_router
from .devices import router as devices_router
from .clients import router as clients_router
from .logs import router as logs_router

router = APIRouter()

router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
router.include_router(devices_router, prefix="/devices", tags=["devices"])
router.include_router(clients_router, prefix="/clients", tags=["clients"])
router.include_router(logs_router, prefix="/logs", tags=["logs"]) 