from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.exporter import Exporter
from app.models.exporter_configuration import ExporterConfiguration

router = APIRouter()

@router.get('/exporter-macs', response_model=List[dict], summary="Получить все MAC-адреса всех экспортёров (с платформой)")
def get_all_exporter_macs(db: Session = Depends(get_db), platform_type: str = Query(None)):
    query = db.query(ExporterConfiguration, Exporter).join(Exporter, ExporterConfiguration.exporter_id == Exporter.id)
    if platform_type:
        query = query.filter(Exporter.platform_type == platform_type)
    result = []
    for config, exporter in query.all():
        for mac in config.mac_addresses or []:
            result.append({
                'mac': mac,
                'exporter_id': exporter.id,
                'platform_id': exporter.platform_id
            })
    return result 