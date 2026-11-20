from datetime import datetime, timedelta, timezone
import hashlib
import re
import secrets
import string
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from auditoria_service import registrar_log
from database import get_db
from models import Usuario
from auth_utils import (
    create_token,
    get_password_hash,
    obter_usuario_logado,
    verify_password,
)
from reservas_lifecycle import reavaliar_suspensao_expirada
import models
import schemas

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])
LIMITE_TENTATIVAS_RESET = 5
DURACAO_BLOQUEIO_RESET = timedelta(minutes=15)
DURACAO_TOKEN_RESET = timedelta(minutes=10)

class DadosLogin(BaseModel):
    email: str = Field(description="E-mail cadastrado na plataforma.")
    senha: str = Field(description="Senha da conta.")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "email": "ana.martins@example.org",
                    "senha": "ExemploForte#2026",
                }
            ]
        }
    )


@router.post(
    "/login",
    response_model=schemas.LoginResponse,
    summary="Iniciar sessão",
    description="Valida as credenciais e devolve um JWT válido por 24 horas.",
    responses={401: {"description": "Credenciais inválidas ou conta inativa."}},
)
def login(dados: DadosLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == dados.email).first()
    
    if not user or not verify_password(dados.senha, user.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if user.status == "INATIVO":
        raise HTTPException(status_code=401, detail="Usuário inativo ou bloqueado.")

    agora_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    reavaliar_suspensao_expirada(db, user, agora_utc)
    user.ultima_atividade = agora_utc
    db.commit()
    token = create_token(user.id, user.perfil)

    return {
        "token": token, 
        "nome": user.nome, 
        "email": user.email, 
        "perfil": user.perfil,
        "status": user.status,
        "deve_trocar_senha": user.deve_trocar_senha,
        "pin_definido": bool(user.pin_hash),
        "suspensao_ate": (
            user.suspensao_ate.replace(tzinfo=timezone.utc)
            if user.suspensao_ate
            else None
        ),
        "avatar_url": user.avatar_url,
        "deve_trocar_senha": user.deve_trocar_senha,
        "ultima_atividade": user.ultima_atividade.replace(tzinfo=timezone.utc),
    }

@router.get(
    "/me",
    response_model=schemas.UsuarioLogadoResponse,
    summary="Consultar sessão atual",
    responses={
        401: {"description": "Token inválido ou expirado."},
        403: {"description": "Cabeçalho de autenticação ausente."},
    },
)
def meu_perfil(usuario: Usuario = Depends(obter_usuario_logado)):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "perfil": usuario.perfil,
        "status": usuario.status,
        "pin_definido": bool(usuario.pin_hash),
        "suspensao_ate": (
            usuario.suspensao_ate.replace(tzinfo=timezone.utc)
            if usuario.suspensao_ate
            else None
        ),
        "avatar_url": usuario.avatar_url,
        "data_nascimento": (
            None if usuario.deve_trocar_senha else usuario.data_nascimento
        ),
        "cpf": None if usuario.deve_trocar_senha else usuario.cpf,
        "rg": None if usuario.deve_trocar_senha else usuario.rg,
        "deve_trocar_senha": usuario.deve_trocar_senha,
        "ultima_atividade": (
            usuario.ultima_atividade.replace(tzinfo=timezone.utc)
            if usuario.ultima_atividade
            else None
        ),
    }


@router.post("/logout")
def logout(usuario: Usuario = Depends(obter_usuario_logado)):
    return {"mensagem": "Sessão encerrada."}


@router.post("/alterar-senha")
def alterar_senha(
    dados: schemas.AlterarSenha,
    usuario: Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    if usuario.deve_trocar_senha:
        raise HTTPException(
            status_code=403,
            detail="Confirme seus dados cadastrados para trocar a senha temporária.",
        )
    if not verify_password(dados.senha_atual, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="A senha atual está incorreta.")
    if verify_password(dados.nova_senha, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="Escolha uma senha diferente da atual.")
    usuario.senha_hash = get_password_hash(dados.nova_senha)
    usuario.deve_trocar_senha = False
    db.commit()
    return {"mensagem": "Senha alterada com sucesso.", "deve_trocar_senha": False}


@router.post("/alterar-senha-temporaria")
def alterar_senha_temporaria(
    dados: schemas.AlterarSenhaTemporaria,
    usuario: Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    if not usuario.deve_trocar_senha:
        raise HTTPException(
            status_code=409,
            detail="Esta operação só está disponível para senhas temporárias.",
        )

    identidade_confere = (
        re.sub(r"\D", "", usuario.cpf or "") == dados.cpf
        and re.sub(r"[^0-9A-Za-z]", "", usuario.rg or "").upper() == dados.rg
        and usuario.data_nascimento == dados.data_nascimento
    )
    if not identidade_confere:
        raise HTTPException(
            status_code=400,
            detail="Os dados informados não correspondem ao cadastro.",
        )
    if verify_password(dados.nova_senha, usuario.senha_hash):
        raise HTTPException(
            status_code=400,
            detail="Escolha uma senha diferente da senha temporária.",
        )

    usuario.senha_hash = get_password_hash(dados.nova_senha)
    usuario.deve_trocar_senha = False
    registrar_log(
        db,
        usuario,
        "SENHA_REDEFINIDA",
        "USUARIO",
        usuario.id,
        "Senha temporária atualizada após conferência dos dados cadastrais.",
    )
    db.commit()
    return {"mensagem": "Senha alterada com sucesso.", "deve_trocar_senha": False}


@router.post("/validar-dados-reset")
def validar_dados_reset(
    dados: schemas.ValidarDadosResetRequest,
    db: Session = Depends(get_db),
):
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    identificador = dados.email
    tentativa = (
        db.query(models.TentativaResetSenha)
        .filter(models.TentativaResetSenha.identificador == identificador)
        .first()
    )
    if tentativa and tentativa.bloqueado_ate and tentativa.bloqueado_ate > agora:
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas inválidas. Tente novamente mais tarde.",
        )
    if tentativa and tentativa.bloqueado_ate and tentativa.bloqueado_ate <= agora:
        tentativa.tentativas = 0
        tentativa.bloqueado_ate = None

    usuario = (
        db.query(Usuario)
        .filter(func.lower(func.trim(Usuario.email)) == identificador)
        .first()
    )
    pin_confere = bool(
        usuario and usuario.pin_hash and verify_password(dados.pin, usuario.pin_hash)
    )
    fatores_conferem = bool(
        usuario
        and usuario.status == "ATIVO"
        and re.sub(r"\D", "", usuario.cpf or "") == dados.cpf
        and re.sub(r"[^0-9A-Za-z]", "", usuario.rg or "").upper() == dados.rg
        and pin_confere
    )
    if not fatores_conferem:
        if tentativa is None:
            tentativa = models.TentativaResetSenha(
                identificador=identificador,
                tentativas=0,
                atualizado_em=agora,
            )
            db.add(tentativa)
        tentativa.tentativas += 1
        tentativa.atualizado_em = agora
        if tentativa.tentativas >= LIMITE_TENTATIVAS_RESET:
            tentativa.bloqueado_ate = agora + DURACAO_BLOQUEIO_RESET
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Os dados informados não correspondem ao cadastro.",
        )

    if tentativa:
        tentativa.tentativas = 0
        tentativa.bloqueado_ate = None
        tentativa.atualizado_em = agora

    db.query(models.TokenResetSenha).filter(
        models.TokenResetSenha.usuario_id == usuario.id,
        models.TokenResetSenha.usado_em.is_(None),
    ).update(
        {models.TokenResetSenha.usado_em: agora},
        synchronize_session=False,
    )
    token = secrets.token_urlsafe(32)
    db.add(
        models.TokenResetSenha(
            id=str(uuid.uuid4()),
            usuario_id=usuario.id,
            token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
            expira_em=agora + DURACAO_TOKEN_RESET,
            criado_em=agora,
        )
    )
    db.commit()
    return {"token": token}


@router.post("/redefinir-senha")
def redefinir_senha(
    dados: schemas.RedefinirSenhaRequest,
    db: Session = Depends(get_db),
):
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    token_hash = hashlib.sha256(dados.token.encode("utf-8")).hexdigest()
    token_reset = (
        db.query(models.TokenResetSenha)
        .filter(models.TokenResetSenha.token_hash == token_hash)
        .first()
    )
    if (
        token_reset is None
        or token_reset.usado_em is not None
        or token_reset.expira_em <= agora
    ):
        raise HTTPException(
            status_code=400,
            detail="O token de redefinição é inválido, expirou ou já foi utilizado.",
        )

    token_atualizado = (
        db.query(models.TokenResetSenha)
        .filter(
            models.TokenResetSenha.id == token_reset.id,
            models.TokenResetSenha.usado_em.is_(None),
            models.TokenResetSenha.expira_em > agora,
        )
        .update(
            {models.TokenResetSenha.usado_em: agora},
            synchronize_session=False,
        )
    )
    if token_atualizado != 1:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="O token de redefinição é inválido, expirou ou já foi utilizado.",
        )

    usuario = db.get(Usuario, token_reset.usuario_id)
    if usuario is None:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="O token de redefinição é inválido, expirou ou já foi utilizado.",
        )
    usuario.senha_hash = get_password_hash(dados.nova_senha)
    usuario.deve_trocar_senha = False
    registrar_log(
        db,
        usuario,
        "SENHA_REDEFINIDA",
        "USUARIO",
        usuario.id,
        "Senha redefinida após validação dos fatores cadastrais.",
    )
    db.commit()
    return {"mensagem": "Senha redefinida com sucesso."}


@router.post("/esqueci-senha", response_model=schemas.MensagemGenericaResponse)
def solicitar_reset_senha(
    dados: schemas.EsqueciSenhaRequest,
    db: Session = Depends(get_db),
):
    mensagem = "Se houver uma conta ativa para este e-mail, o Administrador receberá a solicitação."
    usuario = (
        db.query(Usuario)
        .filter(func.lower(Usuario.email) == dados.email)
        .first()
    )
    if usuario is None or usuario.status == "INATIVO":
        return {"mensagem": mensagem}

    administradores = db.query(Usuario).filter(
        Usuario.perfil == "ADMINISTRADOR",
        Usuario.status == "ATIVO",
    ).all()
    if not administradores:
        return {"mensagem": mensagem}

    limite_repeticao = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10)
    solicitacao_recente = (
        db.query(models.NotificacaoConta.id)
        .filter(
            models.NotificacaoConta.solicitante_id == usuario.id,
            models.NotificacaoConta.criada_em >= limite_repeticao,
        )
        .first()
    )
    if solicitacao_recente:
        return {"mensagem": mensagem}

    for administrador in administradores:
        pendente = (
            db.query(models.NotificacaoConta.id)
            .filter(
                models.NotificacaoConta.destinatario_id == administrador.id,
                models.NotificacaoConta.solicitante_id == usuario.id,
                models.NotificacaoConta.status == "PENDENTE",
            )
            .first()
        )
        if pendente:
            continue
        db.add(models.NotificacaoConta(
            destinatario_id=administrador.id,
            solicitante_id=usuario.id,
            tipo="RESET_SENHA_SOLICITADO",
            titulo="Solicitação de redefinição de senha",
            mensagem=f"O usuário {usuario.nome} solicitou a redefinição da senha.",
        ))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"mensagem": mensagem}