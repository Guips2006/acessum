from sqlalchemy import Column, String, Integer, ForeignKey
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

class Laboratorio(Base):
    __tablename__ = "laboratorios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String, unique=True, index=True)
    capacidade = Column(Integer)
    status = Column(String, default="ATIVO") # ATIVO ou INATIVO

class Equipamento(Base):
    __tablename__ = "equipamentos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String, index=True)
    descricao = Column(String, nullable=True) # Ex: "Core i7, 16GB RAM" ou "Projetor Epson"
    status = Column(String, default="ATIVO") # ATIVO ou INATIVO
    
    # Chave estrangeira que vincula ao laboratório
    laboratorio_id = Column(String(36), ForeignKey("laboratorios.id"))