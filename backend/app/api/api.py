from fastapi import APIRouter
from .v1 import router as v1_router
from .v1.grafana_webhooks import router as grafana_webhooks_router

api_router = APIRouter()
api_router.include_router(v1_router)
api_router.include_router(grafana_webhooks_router) 