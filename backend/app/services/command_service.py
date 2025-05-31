from typing import Dict, Optional, List
import re
from sqlalchemy.orm import Session
from app.models.command_template import CommandTemplate
from app.schemas.command_template import CommandParamSchema
from app.models.log import Log

class CommandService:
    @staticmethod
    def validate_params(params: Dict, schema: List[CommandParamSchema]) -> Dict[str, List[str]]:
        """Валидация параметров команды с детализацией ошибок"""
        errors = {}
        for param in schema:
            param_name = param.name
            value = params.get(param_name)
            
            if param.required and value is None:
                errors.setdefault(param_name, []).append("Parameter is required")
                continue
                
            if value is None:
                continue
                
            if param.type == "number" and not str(value).isdigit():
                errors.setdefault(param_name, []).append("Must be a number")
                
            if param.pattern and not re.match(param.pattern, str(value)):
                errors.setdefault(param_name, []).append(f"Does not match pattern: {param.pattern}")
                
            if param.min is not None and float(value) < param.min:
                errors.setdefault(param_name, []).append(f"Value must be >= {param.min}")
                
            if param.max is not None and float(value) > param.max:
                errors.setdefault(param_name, []).append(f"Value must be <= {param.max}")
        
        return errors

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
