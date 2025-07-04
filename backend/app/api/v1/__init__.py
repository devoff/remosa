from fastapi import APIRouter
from .alerts import router as alerts_router
from .devices import router as devices_router
from .clients import router as clients_router
from .logs import router as logs_router
from .commands import router as commands_router
from .command_templates import router as command_templates_router
from .stats import router as stats_router
# Исправлено: используем правильный auth модуль
from .endpoints.auth import router as auth_router  # Изменено с .auth на .endpoints.auth
from .endpoints.users import router as users_router
from .endpoints.platforms import router as platforms_router
from .audit_logs import router as audit_logs_router
from .health import router as health_router

router = APIRouter()

router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
router.include_router(devices_router, prefix="/devices", tags=["devices"])
router.include_router(clients_router, prefix="/clients", tags=["clients"])
router.include_router(logs_router, prefix="/logs", tags=["logs"])
router.include_router(commands_router, prefix="/commands", tags=["commands"])
router.include_router(command_templates_router, prefix="/command_templates", tags=["Command Templates"])
router.include_router(stats_router, prefix="/stats", tags=["stats"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(platforms_router, prefix="/platforms", tags=["Platforms"])
router.include_router(audit_logs_router, prefix="/audit-logs", tags=["Audit Logs"])
router.include_router(health_router, prefix="/health", tags=["Health"]) 