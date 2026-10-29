from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import relationship
from database import Base
import uuid


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        Index(
            "uq_usuarios_cpf_not_null",
            "cpf",
            unique=True,
            sqlite_where=text("cpf IS NOT NULL"),
        ),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100))
    email = Column(String(100), unique=True)
    senha_hash = Column(String(255))
    perfil = Column(String(20), default="ADMINISTRADOR")
    status = Column(String(20), default="ATIVO")
    avatar_url = Column(String(500), nullable=True)
    ultima_atividade = Column(DateTime, nullable=True)
    suspensao_ate = Column(DateTime, nullable=True)
    cpf = Column(String(11), nullable=True)
    rg = Column(String(30), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    deve_trocar_senha = Column(Boolean, default=False, nullable=False, server_default="0")

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
        Index("ix_reservas_status_data_inicio", "status", "data_inicio"),
        Index("ix_reservas_usuario_no_show", "usuario_id", "status", "data_no_show"),
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
    data_no_show = Column(DateTime, nullable=True)
    laboratorio = relationship("Laboratorio", back_populates="reservas")
    usuario = relationship("Usuario")


class Notificacao(Base):
    __tablename__ = "notificacoes"
    __table_args__ = (
        UniqueConstraint("reserva_id", "tipo", name="uq_notificacao_reserva_tipo"),
        CheckConstraint(
            "tipo IN ('RESERVA_APROVADA', 'RESERVA_RECUSADA', 'CHECKIN_30_MIN')",
            name="ck_notificacao_tipo_valido",
        ),
        Index("ix_notificacoes_usuario_lida_criada", "usuario_id", "lida", "criada_em"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    reserva_id = Column(String(36), ForeignKey("reservas.id"), nullable=False)
    tipo = Column(String(30), nullable=False)
    titulo = Column(String(120), nullable=False)
    mensagem = Column(String(500), nullable=False)
    criada_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    lida = Column(Boolean, default=False, nullable=False, server_default="0")


class LogAuditoria(Base):
    __tablename__ = "logs_auditoria"
    __table_args__ = (
        Index("ix_logs_auditoria_data_acao", "data_hora", "acao"),
        Index("ix_logs_auditoria_usuario", "usuario_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    acao = Column(String(50), nullable=False)
    entidade = Column(String(30), nullable=False)
    entidade_id = Column(String(36), nullable=False)
    descricao = Column(String(500), nullable=False)
    data_hora = Column(DateTime, default=datetime.utcnow, nullable=False)


class NotificacaoConta(Base):
    __tablename__ = "notificacoes_conta"
    __table_args__ = (
        CheckConstraint(
            "tipo = 'RESET_SENHA_SOLICITADO'",
            name="ck_notificacao_conta_tipo_valido",
        ),
        CheckConstraint(
            "status IN ('PENDENTE', 'ATENDIDA')",
            name="ck_notificacao_conta_status_valido",
        ),
        Index("ix_notificacao_conta_destino_status", "destinatario_id", "status", "criada_em"),
        Index(
            "uq_notificacao_reset_pendente",
            "destinatario_id",
            "solicitante_id",
            unique=True,
            sqlite_where=text("status = 'PENDENTE'"),
        ),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destinatario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    solicitante_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String(40), nullable=False)
    titulo = Column(String(120), nullable=False)
    mensagem = Column(String(500), nullable=False)
    criada_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    lida = Column(Boolean, default=False, nullable=False, server_default="0")
    status = Column(String(20), default="PENDENTE", nullable=False, server_default="PENDENTE")
    atendida_por_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    atendida_em = Column(DateTime, nullable=True)