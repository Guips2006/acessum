import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class UsuarioBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=100)
    perfil: Literal["ADMINISTRADOR", "PROFESSOR", "ALUNO"]

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, nome: str) -> str:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome é obrigatório.")
        return nome

    @field_validator("email")
    @classmethod
    def normalizar_e_validar_email(cls, email: str) -> str:
        email = email.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            raise ValueError("Informe um endereço de e-mail válido.")
        return email

class UsuarioCriar(UsuarioBase):
    senha: str = Field(
        min_length=1,
        max_length=72,
        description="Senha da conta (máximo de 72 bytes para compatibilidade com bcrypt).",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "nome": "Ana Martins",
                    "email": "ana.martins@example.org",
                    "perfil": "ALUNO",
                    "senha": "ExemploForte#2026",
                }
            ]
        }
    )

    @field_validator("senha")
    @classmethod
    def validar_senha_nao_vazia(cls, senha: str) -> str:
        if not senha.strip():
            raise ValueError("A senha não pode estar vazia.")
        if len(senha.encode("utf-8")) > 72:
            raise ValueError("A senha não pode exceder 72 bytes.")
        return senha

class UsuarioResponse(UsuarioBase):
    id: str
    status: Literal["ATIVO", "INATIVO"]

    class Config:
        from_attributes = True

class UsuarioStatusResponse(BaseModel):
    id: str
    novo_status: Literal["ATIVO", "INATIVO"]

class EquipamentoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    descricao: str | None = Field(
        default=None,
        max_length=500,
        description="Descrição opcional do equipamento.",
    )
    laboratorio_id: str = Field(
        min_length=1,
        max_length=36,
        description="ID de um laboratório ativo, obtido em GET /api/laboratorios/.",
    )

    @field_validator("nome")
    @classmethod
    def validar_nome_equipamento(cls, nome: str) -> str:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome do equipamento é obrigatório.")
        return nome

    @field_validator("descricao")
    @classmethod
    def normalizar_descricao(cls, descricao: str | None) -> str | None:
        if descricao is None:
            return None
        descricao = descricao.strip()
        return descricao or None

class EquipamentoCriar(EquipamentoBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "nome": "Projetor Epson PowerLite X49",
                    "descricao": "Projetor multimédia com entrada HDMI.",
                    "laboratorio_id": "2cace38d-b322-5d6b-9982-abc30ce9f903",
                }
            ]
        }
    )

class EquipamentoResponse(EquipamentoBase):
    id: str
    status: Literal["ATIVO", "INATIVO"]

    class Config:
        from_attributes = True

class EquipamentoStatusResponse(BaseModel):
    id: str
    novo_status: Literal["ATIVO", "INATIVO"]

class RelatoProblemaCriar(BaseModel):
    tipo_recurso: Literal["LABORATORIO", "EQUIPAMENTO"]
    recurso_id: str = Field(
        min_length=1,
        max_length=36,
        description="ID do recurso escolhido, obtido na listagem de laboratórios ou equipamentos.",
    )
    descricao: str = Field(min_length=1, max_length=2000)
    nivel_severidade: Literal["BAIXA", "MEDIA", "ALTA"]

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "tipo_recurso": "EQUIPAMENTO",
                    "recurso_id": "25503446-4e7c-52c6-ba86-dd201087b26b",
                    "descricao": "A leitura do canal 2 varia durante o teste.",
                    "nivel_severidade": "MEDIA",
                }
            ]
        }
    )

    @field_validator("descricao")
    @classmethod
    def validar_descricao_problema(cls, descricao: str) -> str:
        descricao = descricao.strip()
        if not descricao:
            raise ValueError("A descrição do problema é obrigatória.")
        return descricao

class RelatoProblemaResponse(BaseModel):
    id: str
    usuario_id: str
    usuario_nome: str
    tipo_recurso: Literal["LABORATORIO", "EQUIPAMENTO"]
    recurso_id: str
    recurso_nome: str
    descricao: str
    nivel_severidade: Literal["BAIXA", "MEDIA", "ALTA"]
    status: Literal["ABERTO", "RESOLVIDO"]
    data_hora: datetime

class RelatoProblemaStatusAtualizar(BaseModel):
    status: Literal["ABERTO", "RESOLVIDO"]

    model_config = ConfigDict(
        json_schema_extra={"examples": [{"status": "RESOLVIDO"}]}
    )

class BlocoDisponibilidade(BaseModel):
    inicio: datetime
    fim: datetime

class RecursoDisponibilidade(BaseModel):
    id: str
    nome: str

class DisponibilidadeResponse(BaseModel):
    recurso: RecursoDisponibilidade
    periodo: BlocoDisponibilidade
    blocos_livres: list[BlocoDisponibilidade]
    blocos_ocupados: list[BlocoDisponibilidade]

class ReservaCriar(BaseModel):
    recurso_id: str = Field(
        min_length=1,
        max_length=36,
        description="ID do laboratório ativo, obtido em GET /api/laboratorios/.",
    )
    data_inicio: datetime = Field(
        description="Início da reserva em ISO 8601, incluindo fuso horário."
    )
    data_fim: datetime = Field(
        description="Fim da reserva em ISO 8601, incluindo fuso horário."
    )
    finalidade: str = Field(min_length=1, max_length=500)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "recurso_id": "2cace38d-b322-5d6b-9982-abc30ce9f903",
                    "data_inicio": "2030-01-15T10:00:00Z",
                    "data_fim": "2030-01-15T12:00:00Z",
                    "finalidade": "Aula prática de programação em Python.",
                }
            ]
        }
    )

    @field_validator("data_inicio", "data_fim")
    @classmethod
    def validar_fuso_horario(cls, data: datetime) -> datetime:
        if data.tzinfo is None or data.utcoffset() is None:
            raise ValueError("A data deve incluir fuso horário.")
        return data

    @field_validator("finalidade")
    @classmethod
    def validar_finalidade(cls, finalidade: str) -> str:
        finalidade = finalidade.strip()
        if not finalidade:
            raise ValueError("A finalidade da reserva é obrigatória.")
        return finalidade

    @model_validator(mode="after")
    def validar_periodo(self):
        if self.data_fim <= self.data_inicio:
            raise ValueError("data_fim deve ser posterior a data_inicio.")
        return self

class ReservaResponse(BaseModel):
    id: str
    usuario_id: str
    laboratorio_id: str
    laboratorio_nome: str
    data_inicio: datetime
    data_fim: datetime
    finalidade: str
    status: Literal["PENDENTE", "APROVADA", "RECUSADA", "EM_USO", "CONCLUIDA", "CANCELADA", "NO_SHOW"]

class ReservaAnaliseAtualizar(BaseModel):
    status: Literal["APROVADA", "RECUSADA"]
    motivo_recusa: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "status": "APROVADA",
                    "motivo_recusa": None,
                },
                {
                    "status": "RECUSADA",
                    "motivo_recusa": "Conflito com uma atividade curricular.",
                },
            ]
        }
    )

    @field_validator("motivo_recusa")
    @classmethod
    def normalizar_motivo_recusa(cls, motivo: str | None) -> str | None:
        if motivo is None:
            return None
        motivo = motivo.strip()
        return motivo or None

class ReservaAnaliseResponse(BaseModel):
    id: str
    usuario_id: str
    usuario_nome: str
    laboratorio_id: str
    laboratorio_nome: str
    data_inicio: datetime
    data_fim: datetime
    finalidade: str
    status: Literal["PENDENTE", "APROVADA", "RECUSADA", "EM_USO", "CONCLUIDA", "CANCELADA", "NO_SHOW"]
    motivo_recusa: str | None

class ReservaHistoricoResponse(BaseModel):
    id: str
    laboratorio_id: str
    laboratorio_nome: str
    data_inicio: datetime
    data_fim: datetime
    finalidade: str
    status: Literal["PENDENTE", "APROVADA", "RECUSADA", "EM_USO", "CONCLUIDA", "CANCELADA", "NO_SHOW"]
    motivo_recusa: str | None
    data_fim_real: datetime | None


class LoginResponse(BaseModel):
    token: str = Field(description="JWT para uso no cabeçalho Authorization: Bearer.")
    nome: str
    email: str
    perfil: Literal["ADMINISTRADOR", "PROFESSOR", "ALUNO"]


class UsuarioLogadoResponse(BaseModel):
    id: str
    nome: str
    email: str
    perfil: Literal["ADMINISTRADOR", "PROFESSOR", "ALUNO"]


class HealthResponse(BaseModel):
    mensagem: str

class LaboratorioBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    capacidade: int = Field(gt=0)

    @field_validator("nome")
    @classmethod
    def validar_nome_laboratorio(cls, nome: str) -> str:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome do laboratório é obrigatório.")
        return nome

class LaboratorioCriar(LaboratorioBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "nome": "Laboratório de Redes e Sistemas - Anexo",
                    "capacidade": 24,
                }
            ]
        }
    )

class LaboratorioResponse(LaboratorioBase):
    id: str
    status: Literal["ATIVO", "INATIVO"]
    equipamentos: list[EquipamentoResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class LaboratorioStatusResponse(BaseModel):
    id: str
    novo_status: Literal["ATIVO", "INATIVO"]