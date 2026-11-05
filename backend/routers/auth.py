from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import func, or_
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
LIMITE_TENTATIVAS_RESET = 5
JANELA_TENTATIVAS_RESET = timedelta(minutes=15)
RETENCAO_TENTATIVAS_RESET = timedelta(days=1)
VALIDADE_TOKEN_RESET = timedelta(minutes=10)
DUMMY_RESET_PIN_HASH = get_password_hash(secrets.token_hex(16))

class DadosLogin(BaseModel):
    email: str
    senha: str

@router.post("/login", response_model=schemas.LoginResponse)
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
        "pin_configurado": user.pin_hash is not None,
        "suspensao_ate": (
            user.suspensao_ate.replace(tzinfo=timezone.utc)
            if user.suspensao_ate
            else None
        ),
        "avatar_url": user.avatar_url,
        "deve_trocar_senha": user.deve_trocar_senha,
        "ultima_atividade": user.ultima_atividade.replace(tzinfo=timezone.utc),
    }

@router.get("/me", response_model=schemas.PerfilUsuarioResponse)
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
        "pin_configurado": usuario.pin_hash is not None,
        "pin_definido": bool(usuario.pin_hash),
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


@router.post(
    "/validar-dados-reset",
    response_model=schemas.TokenResetSenhaResponse,
)
def validar_dados_reset(
    dados: schemas.ValidarDadosResetRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    endereco_ip = request.client.host if request.client else "desconhecido"
    chave_ip = hashlib.sha256(endereco_ip.encode("utf-8")).hexdigest()

    db.query(models.TentativaResetSenha).filter(
        models.TentativaResetSenha.criada_em < agora - RETENCAO_TENTATIVAS_RESET
    ).delete(synchronize_session=False)
    db.query(models.TokenResetSenha).filter(
        or_(
            models.TokenResetSenha.expira_em <= agora,
            models.TokenResetSenha.consumido_em.is_not(None),
        )
    ).delete(synchronize_session=False)
    tentativas = db.query(models.TentativaResetSenha).filter(
        models.TentativaResetSenha.chave_ip == chave_ip,
        models.TentativaResetSenha.criada_em >= agora - JANELA_TENTATIVAS_RESET,
    ).count()
    if tentativas >= LIMITE_TENTATIVAS_RESET:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Aguarde antes de tentar novamente.",
        )

    db.add(models.TentativaResetSenha(chave_ip=chave_ip, criada_em=agora))
    db.commit()

    usuario = (
        db.query(Usuario)
        .filter(
            func.lower(Usuario.email) == dados.email,
            Usuario.cpf == dados.cpf,
            Usuario.rg == dados.rg,
            Usuario.status == "ATIVO",
        )
        .first()
    )
    hash_pin = (
        usuario.pin_hash
        if usuario is not None and usuario.pin_hash
        else DUMMY_RESET_PIN_HASH
    )
    pin_valido = verify_password(dados.pin, hash_pin)
    if usuario is None or usuario.pin_hash is None or not pin_valido:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail, CPF, RG ou PIN de segurança inválidos.",
        )

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    db.query(models.TokenResetSenha).filter(
        models.TokenResetSenha.usuario_id == usuario.id,
        models.TokenResetSenha.consumido_em.is_(None),
    ).update(
        {"consumido_em": agora},
        synchronize_session=False,
    )
    db.add(
        models.TokenResetSenha(
            usuario_id=usuario.id,
            token_hash=token_hash,
            criado_em=agora,
            expira_em=agora + VALIDADE_TOKEN_RESET,
        )
    )
    db.commit()
    return {
        "token": token,
        "mensagem": "Dados validados. Defina uma nova senha.",
    }


@router.post(
    "/redefinir-senha",
    response_model=schemas.MensagemGenericaResponse,
)
def redefinir_senha_com_token(
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
    if token_reset is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O link de redefinição é inválido ou expirou.",
        )

    consumido = db.query(models.TokenResetSenha).filter(
        models.TokenResetSenha.id == token_reset.id,
        models.TokenResetSenha.consumido_em.is_(None),
        models.TokenResetSenha.expira_em > agora,
    ).update(
        {"consumido_em": agora},
        synchronize_session=False,
    )
    if consumido != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O link de redefinição é inválido ou expirou.",
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == token_reset.usuario_id,
        Usuario.status == "ATIVO",
    ).first()
    if usuario is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O link de redefinição é inválido ou expirou.",
        )

    usuario.senha_hash = get_password_hash(dados.nova_senha)
    usuario.deve_trocar_senha = False
    db.commit()
    return {"mensagem": "Senha redefinida com sucesso."}