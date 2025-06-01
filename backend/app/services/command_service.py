from typing import Dict, Optional, List, Any
import re
from sqlalchemy.orm import Session
from app.models.command_template import CommandTemplate
from app.schemas.command_template import CommandParamSchema
from app.models.log import Log

class CommandService:
    @staticmethod
    def validate_params(params: Dict, schema: Dict[str, Any]) -> Dict[str, List[str]]:
        """Валидация параметров команды с детализацией ошибок"""
        errors = {}
        required_params = set(schema.get("required", []))

        for param_name, param_definition in schema.get("properties", {}).items():
            value = params.get(param_name)

            if param_name in required_params and value is None:
                errors.setdefault(param_name, []).append("Parameter is required")
                continue

            if value is None:
                continue

            if param_definition.get("type") == "number" or param_definition.get("type") == "integer":
                try:
                    float(value)
                except (ValueError, TypeError):
                    errors.setdefault(param_name, []).append("Must be a number")
            
            if param_definition.get("pattern") and not re.match(param_definition["pattern"], str(value)):
                errors.setdefault(param_name, []).append(f"Does not match pattern: {param_definition['pattern']}")
            
            if (param_definition.get("type") == "number" or param_definition.get("type") == "integer") and value is not None:
                try:
                    numeric_value = float(value)
                    if param_definition.get("min") is not None and numeric_value < param_definition["min"]:
                        errors.setdefault(param_name, []).append(f"Value must be >= {param_definition['min']}")
                    
                    if param_definition.get("max") is not None and numeric_value > param_definition["max"]:
                        errors.setdefault(param_name, []).append(f"Value must be <= {param_definition['max']}")
                except (ValueError, TypeError):
                    pass # Error for non-numeric value should already be added by the 'number' type check or pattern check

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
        response: Optional[str] = None,
        level: str = "info"
    ):
        log = Log(
            device_id=device_id,
            message=f"Command {command}: {status}",
            level=level,
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

    @staticmethod
    def get_all_command_logs(db: Session) -> List[Log]:
        return db.query(Log).order_by(Log.created_at.desc()).all()
