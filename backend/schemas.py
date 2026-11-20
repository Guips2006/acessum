import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def normalizar_rg_validado(rg: str | None) -> str | None:
    if rg is None:
        return None
    if len(rg) > 12 or not re.fullmatch(r"[0-9Xx.-]+", rg):
        raise ValueError("O RG deve conter apenas números, a letra X, pontos e hífen.")
    normalizado = re.sub(r"[.-]", "", rg).upper()
    if not 5 <= len(normalizado) <= 9:
        raise ValueError("O RG deve conter entre 5 e 9 caracteres alfanuméricos.")
    return normalizado


class UsuarioBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=100)
    perfil: Literal["ADMINISTRADOR", "PROFESSOR", "ALUNO"]
    cpf: str | None = None
    rg: str | None = Field(default=None, min_length=1, max_length=12)
    data_nascimento: date | None = None

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

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, cpf: str | None) -> str | None:
        if cpf is None:
            return None
        digitos = re.sub(r"\D", "", cpf)
        if len(digitos) != 11 or len(set(digitos)) == 1:
            raise ValueError("Informe um CPF válido.")
        for posicao in (9, 10):
            soma = sum(int(digitos[indice]) * (posicao + 1 - indice) for indice in range(posicao))
            digito = (soma * 10) % 11
            digito = 0 if digito == 10 else digito
            if digito != int(digitos[posicao]):
                raise ValueError("Informe um CPF válido.")
        return digitos

    @field_validator("rg")
    @classmethod
    def normalizar_rg(cls, rg: str | None) -> str | None:
        return normalizar_rg_validado(rg)

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, data_nascimento: date | None) -> date | None:
        if data_nascimento is not None and data_nascimento >= date.today():
            raise ValueError("A data de nascimento deve estar no passado.")
        return data_nascimento

class UsuarioCriar(UsuarioBase):
    cpf: str = Field(min_length=11, max_length=14)
    rg: str = Field(min_length=1, max_length=12)
    data_nascimento: date
    senha: str = Field(
        min_length=12,
        max_length=72,
        description=(
            "Senha da conta com no mínimo 12 caracteres e máximo de 72 bytes "
            "para compatibilidade com bcrypt."
        ),
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "nome": "Ana Martins",
                    "email": "ana.martins@example.org",
                    "perfil": "ALUNO",
                    "cpf": "529.982.247-25",
                    "rg": "12.345.678-9",
                    "data_nascimento": "2000-01-15",
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
        if not any(caractere.isalpha() for caractere in senha) or not any(caractere.isdigit() for caractere in senha):
            raise ValueError("A senha deve conter letras e números.")
        return senha

class UsuarioResponse(UsuarioBase):
    id: str
    status: Literal["ATIVO", "INATIVO", "SUSPENSO"]
    suspensao_ate: datetime | None = None
    deve_trocar_senha: bool = False
    pin_definido: bool = False

    class Config:
        from_attributes = True

class UsuarioStatusResponse(BaseModel):
    id: str
    novo_status: Literal["ATIVO", "INATIVO", "SUSPENSO"]

class PerfilUsuarioAtualizar(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    cpf: str = Field(min_length=11, max_length=14)
    rg: str = Field(min_length=1, max_length=12)
    data_nascimento: date

    @field_validator("nome")
    @classmethod
    def validar_nome_perfil(cls, nome: str) -> str:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome é obrigatório.")
        return nome

    @field_validator("cpf")
    @classmethod
    def validar_cpf_perfil(cls, cpf: str) -> str:
        return UsuarioBase.validar_cpf(cpf)

    @field_validator("rg")
    @classmethod
    def validar_rg_perfil(cls, rg: str) -> str:
        return normalizar_rg_validado(rg)

    @field_validator("data_nascimento")
    @classmethod
    def validar_nascimento_perfil(cls, valor: date) -> date:
        return UsuarioBase.validar_data_nascimento(valor)

class PerfilUsuarioResponse(BaseModel):
    id: str
    nome: str
    email: str
    perfil: Literal["ADMINISTRADOR", "PROFESSOR", "ALUNO"]
    avatar_url: str | None
    ultima_atividade: datetime | None
    status: Literal["ATIVO", "INATIVO", "SUSPENSO"]
    suspensao_ate: datetime | None
    cpf: str | None
    rg: str | None
    data_nascimento: date | None
    deve_trocar_senha: bool


class PinSegurancaAtualizar(BaseModel):
    pin: str
    confirmar_pin: str

    @field_validator("pin", "confirmar_pin")
    @classmethod
    def validar_pin(cls, pin: str) -> str:
        if not re.fullmatch(r"[0-9]{6}", pin):
            raise ValueError("O PIN deve conter exatamente 6 dígitos numéricos.")
        return pin

    @model_validator(mode="after")
    def validar_confirmacao_pin(self):
        if self.pin != self.confirmar_pin:
            raise ValueError("Os PINs informados não são iguais.")
        return self


class AlterarSenha(BaseModel):
    senha_atual: str = Field(min_length=1, max_length=72)
    nova_senha: str = Field(min_length=12, max_length=72)

    @field_validator("nova_senha")
    @classmethod
    def validar_nova_senha(cls, senha: str) -> str:
        return validar_nova_senha(senha)

class AlterarSenhaTemporaria(BaseModel):
    cpf: str = Field(min_length=11, max_length=14)
    rg: str = Field(min_length=1, max_length=12)
    data_nascimento: date
    nova_senha: str = Field(min_length=12, max_length=72)

    @field_validator("cpf")
    @classmethod
    def normalizar_cpf(cls, cpf: str) -> str:
        return re.sub(r"\D", "", cpf)

    @field_validator("rg")
    @classmethod
    def normalizar_rg(cls, rg: str) -> str:
        return normalizar_rg_validado(rg)

    @field_validator("nova_senha")
    @classmethod
    def validar_nova_senha_temporaria(cls, senha: str) -> str:
        return validar_nova_senha(senha)

def validar_nova_senha(senha: str) -> str:
    if len(senha.encode("utf-8")) > 72:
        raise ValueError("A nova senha não pode exceder 72 bytes.")
    if not any(caractere.isalpha() for caractere in senha) or not any(caractere.isdigit() for caractere in senha):
        raise ValueError("A nova senha deve conter letras e números.")
    return senha

class EsqueciSenhaRequest(BaseModel):
    email: str = Field(min_length=3, max_length=100)

    @field_validator("email")
    @classmethod
    def normalizar_email_reset(cls, email: str) -> str:
        return UsuarioBase.normalizar_e_validar_email(email)


class ValidarDadosResetRequest(BaseModel):
    email: str = Field(min_length=3, max_length=100)
    cpf: str = Field(min_length=1, max_length=14)
    rg: str = Field(min_length=1, max_length=12)
    pin: str

    @field_validator("email")
    @classmethod
    def normalizar_email_validacao_reset(cls, email: str) -> str:
        return UsuarioBase.normalizar_e_validar_email(email)

    @field_validator("cpf")
    @classmethod
    def normalizar_cpf_reset(cls, cpf: str) -> str:
        digitos = re.sub(r"\D", "", cpf)
        if len(digitos) != 11:
            raise ValueError("O CPF deve conter 11 dígitos.")
        return digitos

    @field_validator("rg")
    @classmethod
    def normalizar_rg_reset(cls, rg: str) -> str:
        normalizado = re.sub(r"[^0-9A-Za-z]", "", rg).upper()
        if not 1 <= len(normalizado) <= 9:
            raise ValueError("O RG deve conter até 9 caracteres alfanuméricos.")
        return normalizado

    @field_validator("pin")
    @classmethod
    def validar_pin_reset(cls, pin: str) -> str:
        if not re.fullmatch(r"[0-9]{6}", pin):
            raise ValueError("O PIN deve conter exatamente 6 dígitos numéricos.")
        return pin


class RedefinirSenhaRequest(BaseModel):
    token: str = Field(min_length=1, max_length=256)
    nova_senha: str = Field(min_length=8, max_length=72)
    confirmar_senha: str = Field(min_length=8, max_length=72)

    @field_validator("nova_senha")
    @classmethod
    def validar_complexidade_senha_reset(cls, senha: str) -> str:
        if len(senha.encode("utf-8")) > 72:
            raise ValueError("A nova senha não pode exceder 72 bytes.")
        if (
            len(senha) < 8
            or not any(caractere.isupper() for caractere in senha)
            or not any(caractere.islower() for caractere in senha)
            or not any(caractere.isdecimal() for caractere in senha)
            or not any(
                not caractere.isalnum() and not caractere.isspace()
                for caractere in senha
            )
        ):
            raise ValueError(
                "A nova senha deve ter no mínimo 8 caracteres, com letra maiúscula, "
                "letra minúscula, número e caractere especial."
            )
        return senha

    @model_validator(mode="after")
    def validar_confirmacao_senha_reset(self):
        if self.nova_senha != self.confirmar_senha:
            raise ValueError("A confirmação da nova senha não confere.")
        return self


class ResetSenhaResponse(BaseModel):
    notificacao_id: str
    senha_temporaria: str
    mensagem: str

class MensagemGenericaResponse(BaseModel):
    mensagem: str

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