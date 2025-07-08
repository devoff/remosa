from sqlalchemy import Column, Integer, String, Text, JSON
from app.db.base_class import Base

class CommandTemplate(Base):
    __tablename__ = "command_templates"

    id = Column(Integer, primary_key=True)
    model = Column(String(50), nullable=False)  # Было device_type
    category = Column(String(100), nullable=False)    # "Управление", "Оповещения"
    subcategory = Column(String(100), nullable=True)  # "Питание", "Температура"
    name = Column(String(100), nullable=False)        # "Включить питание"
    template = Column(String(200), nullable=False)    # "#01#{param}#"
    description = Column(Text, nullable=True)
    params_schema = Column(JSON, nullable=False)      # Храним как список словарей
