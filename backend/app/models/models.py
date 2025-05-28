from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    devices = relationship("Device", back_populates="client")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True)
    phone_number = Column(String, unique=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    name = Column(String)
    status = Column(String)
    last_seen = Column(DateTime)
    
    client = relationship("Client", back_populates="devices")
    alerts = relationship("Alert", back_populates="device")
    command_logs = relationship("CommandLog", back_populates="device")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    alert_type = Column(String)
    message = Column(String)
    data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="alerts")

class CommandLog(Base):
    __tablename__ = "command_logs"
    
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    command = Column(String)
    status = Column(String)
    response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="command_logs") 