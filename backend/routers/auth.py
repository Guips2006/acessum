from datetime import datetime, timedelta, timezone
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
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

router = APIRouter(prefix="/api/auth")

class DadosLogin(BaseModel):
    email: str
    senha: str

@router.post("/login")
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
        "suspensao_ate": (
            user.suspensao_ate.replace(tzinfo=timezone.utc)
            if user.suspensao_ate
            else None
        ),
        "avatar_url": user.avatar_url,
        "deve_trocar_senha": user.deve_trocar_senha,
        "ultima_atividade": user.ultima_atividade.replace(tzinfo=timezone.utc),
    }

@router.get("/me")
def meu_perfil(usuario: Usuario = Depends(obter_usuario_logado)):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "perfil": usuario.perfil,
        "status": usuario.status,
        "suspensao_ate": (
            usuario.suspensao_ate.replace(tzinfo=timezone.utc)
            if usuario.suspensao_ate
            else None
        ),
        "avatar_url": usuario.avatar_url,
        "cpf": usuario.cpf,
        "rg": usuario.rg,
        "data_nascimento": usuario.data_nascimento,
        "deve_trocar_senha": usuario.deve_trocar_senha,
        "ultima_atividade": (
            usuario.ultima_atividade.replace(tzinfo=timezone.utc)
            if usuario.ultima_atividade
            else None
        ),
    }


@router.post("/alterar-senha")
def alterar_senha(
    dados: schemas.AlterarSenha,
    usuario: Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    if not verify_password(dados.senha_atual, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="A senha atual está incorreta.")
    if verify_password(dados.nova_senha, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="Escolha uma senha diferente da atual.")
    usuario.senha_hash = get_password_hash(dados.nova_senha)
    usuario.deve_trocar_senha = False
    db.commit()
    return {"mensagem": "Senha alterada com sucesso.", "deve_trocar_senha": False}


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