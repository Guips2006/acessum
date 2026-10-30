import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

class UsuarioBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=100)
    perfil: Literal["ADMINISTRADOR", "PROFESSOR", "ALUNO"]
    cpf: str | None = None
    rg: str | None = Field(default=None, min_length=5, max_length=30)
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
        if rg is None:
            return None
        normalizado = re.sub(r"[^0-9A-Za-z]", "", rg).upper()
        if len(normalizado) < 5 or len(normalizado) > 20:
            raise ValueError("Informe um RG válido.")
        return normalizado

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, data_nascimento: date | None) -> date | None:
        if data_nascimento is not None and data_nascimento >= date.today():
            raise ValueError("A data de nascimento deve estar no passado.")
        return data_nascimento

class UsuarioCriar(UsuarioBase):
    cpf: str = Field(min_length=11, max_length=14)
    rg: str = Field(min_length=5, max_length=30)
    data_nascimento: date
    senha: str = Field(min_length=12, max_length=72)

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

    class Config:
        from_attributes = True

class UsuarioStatusResponse(BaseModel):
    id: str
    novo_status: Literal["ATIVO", "INATIVO", "SUSPENSO"]

class PerfilUsuarioAtualizar(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    cpf: str = Field(min_length=11, max_length=14)
    rg: str = Field(min_length=5, max_length=30)
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
        return UsuarioBase.normalizar_rg(rg)

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

class AlterarSenha(BaseModel):
    senha_atual: str = Field(min_length=1, max_length=72)
    nova_senha: str = Field(min_length=12, max_length=72)

    @field_validator("nova_senha")
    @classmethod
    def validar_nova_senha(cls, senha: str) -> str:
        return validar_nova_senha(senha)

class AlterarSenhaTemporaria(BaseModel):
    cpf: str = Field(min_length=11, max_length=14)
    rg: str = Field(min_length=5, max_length=30)
    data_nascimento: date
    nova_senha: str = Field(min_length=12, max_length=72)

    @field_validator("cpf")
    @classmethod
    def normalizar_cpf(cls, cpf: str) -> str:
        return re.sub(r"\D", "", cpf)

    @field_validator("rg")
    @classmethod
    def normalizar_rg(cls, rg: str) -> str:
        return re.sub(r"[^0-9A-Za-z]", "", rg).upper()

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

class ResetSenhaResponse(BaseModel):
    notificacao_id: str
    senha_temporaria: str
    mensagem: str

class MensagemGenericaResponse(BaseModel):
    mensagem: str

class EquipamentoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=500)
    laboratorio_id: str = Field(min_length=1, max_length=36)

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
    pass

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
    recurso_id: str = Field(min_length=1, max_length=36)
    descricao: str = Field(min_length=1, max_length=2000)
    nivel_severidade: Literal["BAIXA", "MEDIA", "ALTA"]

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
    recurso_id: str = Field(min_length=1, max_length=36)
    data_inicio: datetime
    data_fim: datetime
    finalidade: str = Field(min_length=1, max_length=500)

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
    pass

class LaboratorioResponse(LaboratorioBase):
    id: str
    status: Literal["ATIVO", "INATIVO"]
    equipamentos: list[EquipamentoResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class LaboratorioStatusResponse(BaseModel):
    id: str
    novo_status: Literal["ATIVO", "INATIVO"]