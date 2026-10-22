from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
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
    nome = Column(String(100), unique=True, index=True, nullable=False)
    capacidade = Column(Integer, nullable=False)
    status = Column(String(20), default="ATIVO", nullable=False)
    equipamentos = relationship(
        "Equipamento",
        back_populates="laboratorio",
        order_by="Equipamento.nome",
    )
    reservas = relationship("Reserva", back_populates="laboratorio")

class Equipamento(Base):
    __tablename__ = "equipamentos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), index=True, nullable=False)
    descricao = Column(String(500), nullable=True)
    status = Column(String(20), default="ATIVO", nullable=False)
    laboratorio_id = Column(String(36), ForeignKey("laboratorios.id"), nullable=False)
    laboratorio = relationship("Laboratorio", back_populates="equipamentos")

class RelatoProblema(Base):
    __tablename__ = "relatos_problemas"
    __table_args__ = (
        CheckConstraint(
            "(laboratorio_id IS NOT NULL AND equipamento_id IS NULL) OR "
            "(laboratorio_id IS NULL AND equipamento_id IS NOT NULL)",
            name="ck_relato_problema_exatamente_um_recurso",
        ),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    laboratorio_id = Column(String(36), ForeignKey("laboratorios.id"), nullable=True)
    equipamento_id = Column(String(36), ForeignKey("equipamentos.id"), nullable=True)
    descricao = Column(String(2000), nullable=False)
    nivel_severidade = Column(String(10), nullable=False)
    status = Column(String(20), default="ABERTO", nullable=False)
    data_hora = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario")
    laboratorio = relationship("Laboratorio")
    equipamento = relationship("Equipamento")

class Reserva(Base):
    __tablename__ = "reservas"
    __table_args__ = (
        CheckConstraint("data_fim > data_inicio", name="ck_reserva_periodo_valido"),
        CheckConstraint(
            "status IN ('PENDENTE', 'APROVADA', 'RECUSADA', 'EM_USO', "
            "'CONCLUIDA', 'CANCELADA', 'NO_SHOW')",
            name="ck_reserva_status_valido",
        ),
        Index("ix_reservas_laboratorio_periodo", "laboratorio_id", "data_inicio", "data_fim"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    laboratorio_id = Column(String(36), ForeignKey("laboratorios.id"), nullable=False)
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    data_inicio = Column(DateTime, nullable=False)
    data_fim = Column(DateTime, nullable=False)
    finalidade = Column(
        String(500),
        nullable=False,
        default="Reserva legada sem finalidade informada",
        server_default="Reserva legada sem finalidade informada",
    )
    status = Column(String(20), nullable=False, default="PENDENTE")
    motivo_recusa = Column(String(500), nullable=True)
    data_fim_real = Column(DateTime, nullable=True)
    laboratorio = relationship("Laboratorio", back_populates="reservas")
    usuario = relationship("Usuario")