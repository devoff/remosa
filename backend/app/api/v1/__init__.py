from fastapi import APIRouter
from .alerts import router as alerts_router
from .devices import router as devices_router
from .clients import router as clients_router
from .logs import router as logs_router
from .commands import router as commands_router
from .stats import router as stats_router
from .auth import router as auth_router

router = APIRouter()

router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
router.include_router(devices_router, prefix="/devices", tags=["devices"])
router.include_router(clients_router, prefix="/clients", tags=["clients"])
router.include_router(logs_router, prefix="/logs", tags=["logs"])
router.include_router(commands_router, prefix="/commands", tags=["commands"])
router.include_router(stats_router, prefix="/stats", tags=["stats"])
router.include_router(auth_router, prefix="/auth", tags=["auth"]) 