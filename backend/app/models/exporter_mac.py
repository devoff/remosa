from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ExporterMac(Base):
    __tablename__ = "exporter_macs"

    id = Column(Integer, primary_key=True, index=True)
    exporter_id = Column(Integer, ForeignKey("exporters.id"), nullable=False)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    mac = Column(String(32), nullable=False)
    name = Column(String(255), nullable=True)
    ip = Column(String(64), nullable=True)
    outip = Column(String(64), nullable=True)

    exporter = relationship("Exporter", back_populates="macs")
    platform = relationship("Platform") 