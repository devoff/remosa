from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class CommandParamSchema(BaseModel):
    name: str
    type: str = "string"
    pattern: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None

class CommandTemplateBase(BaseModel):
    model: str
    category: str
    subcategory: Optional[str] = None
    name: str
    template: str
    description: Optional[str] = None
    params_schema: Dict[str, Any]

class CommandTemplateCreate(CommandTemplateBase):
    pass

class CommandTemplateUpdate(CommandTemplateBase):
    pass

class CommandTemplateResponse(CommandTemplateBase):
    id: int

    class Config:
        from_attributes = True
