from sqlalchemy import Column, String
from database import Base
import uuid

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100))
    email = Column(String(100), unique=True)
    senha_hash = Column(String(255))
    perfil = Column(String(20), default="ADMINISTRADOR")
    status = Column(String(20), default="ATIVO")