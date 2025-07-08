from datetime import datetime
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, field_validator
import json

class CommandLogBase(BaseModel):
    device_id: Optional[int] = None
    message: str
    command: Optional[str] = None
    level: str
    status: Optional[str] = None
    response: Optional[str] = None
    execution_time: Optional[datetime] = None
    extra_data: Optional[Union[Dict[str, Any], str]] = None

class CommandLogCreate(CommandLogBase):
    pass

class CommandLogResponse(CommandLogBase):
    id: int
    created_at: datetime

    @field_validator('extra_data', mode='before')
    @classmethod
    def parse_extra_data(cls, v: Any) -> Optional[Dict[str, Any]]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v

    class Config:
        from_attributes = True
