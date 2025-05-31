from typing import Dict, Optional, List
import re
from sqlalchemy.orm import Session
from app.models.command_template import CommandTemplate
from app.schemas.command_template import CommandParamSchema
from app.models.log import Log

class CommandService:
    @staticmethod
    def validate_params(params: Dict, schema: List[CommandParamSchema]) -> bool:
        for param in schema:
            value = params.get(param.name)
            if value is None:
                return False
            
            if param.type == "number" and not str(value).isdigit():
                return False
                
            if param.pattern and not re.match(param.pattern, str(value)):
                return False
                
            if param.min is not None and float(value) < param.min:
                return False
                
            if param.max is not None and float(value) > param.max:
                return False
        return True

    @staticmethod
    def build_command(db: Session, template_id: int, params: dict):
        template = db.query(CommandTemplate).get(template_id)
        if not template:
            return None
        return {"command": template.template.format(**params)}

    @staticmethod
    def get_templates(db: Session, model: str):
        return db.query(CommandTemplate).filter(
            CommandTemplate.model == model
        ).all()

    @staticmethod
    def log_command(
        db: Session,
        device_id: int,
        command: str,
        status: str,
        response: Optional[str] = None
    ):
        log = Log(
            device_id=device_id,
            message=f"Command {command}: {status}",
            level="info" if status == "success" else "error",
            command=command,
            response=response
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_command_logs(db: Session, device_id: int) -> List[Log]:
        return db.query(Log).filter(
            Log.device_id == device_id
        ).order_by(Log.created_at.desc()).all()
