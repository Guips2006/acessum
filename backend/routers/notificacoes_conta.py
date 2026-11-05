import secrets
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auditoria_service import registrar_log
from auth_utils import exigir_perfil, get_password_hash
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/notificacoes-conta",
    tags=["Solicitações de Conta"],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)


class SolicitacaoResetResponse(BaseModel):
    id: str
    solicitante_id: str
    solicitante_nome: str
    solicitante_email: str
    criada_em: datetime


class ListaSolicitacoesResetResponse(BaseModel):
    solicitacoes: list[SolicitacaoResetResponse]


def gerar_senha_temporaria() -> str:
    gerador = secrets.SystemRandom()
    caracteres = [
        gerador.choice(string.ascii_lowercase),
        gerador.choice(string.ascii_uppercase),
        gerador.choice(string.digits),
    ]
    caracteres.extend(gerador.choice(string.ascii_letters + string.digits) for _ in range(17))
    gerador.shuffle(caracteres)
    return "".join(caracteres)


@router.get("", response_model=ListaSolicitacoesResetResponse)
def listar_solicitacoes_reset(
    ator: models.Usuario = Depends(exigir_perfil(["ADMINISTRADOR"])),
    db: Session = Depends(get_db),
):
    solicitacoes = (
        db.query(models.NotificacaoConta, models.Usuario.nome, models.Usuario.email)
        .join(models.Usuario, models.Usuario.id == models.NotificacaoConta.solicitante_id)
        .filter(
            models.NotificacaoConta.status == "PENDENTE",
            models.NotificacaoConta.destinatario_id == ator.id,
        )
        .order_by(models.NotificacaoConta.criada_em.desc())
        .limit(100)
        .all()
    )
    return ListaSolicitacoesResetResponse(
        solicitacoes=[
            SolicitacaoResetResponse(
                id=notificacao.id,
                solicitante_id=notificacao.solicitante_id,
                solicitante_nome=nome,
                solicitante_email=email,
                criada_em=notificacao.criada_em.replace(tzinfo=timezone.utc),
            )
            for notificacao, nome, email in solicitacoes
        ]
    )


@router.post("/{notificacao_id}/redefinir", response_model=schemas.ResetSenhaResponse)
def redefinir_senha(
    notificacao_id: str,
    ator: models.Usuario = Depends(exigir_perfil(["ADMINISTRADOR"])),
    db: Session = Depends(get_db),
):
    notificacao = (
        db.query(models.NotificacaoConta)
        .filter(
            models.NotificacaoConta.id == notificacao_id,
            models.NotificacaoConta.destinatario_id == ator.id,
            models.NotificacaoConta.status == "PENDENTE",
        )
        .first()
    )
    if notificacao is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitação pendente não encontrada.",
        )

    usuario = db.query(models.Usuario).filter(
        models.Usuario.id == notificacao.solicitante_id
    ).first()
    if usuario is None or usuario.status == "INATIVO":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A conta solicitante não está ativa.",
        )

    senha_temporaria = gerar_senha_temporaria()
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    usuario.senha_hash = get_password_hash(senha_temporaria)
    usuario.deve_trocar_senha = True
    db.query(models.NotificacaoConta).filter(
        models.NotificacaoConta.solicitante_id == usuario.id,
        models.NotificacaoConta.status == "PENDENTE",
    ).update(
        {
            "status": "ATENDIDA",
            "lida": True,
            "atendida_por_id": ator.id,
            "atendida_em": agora,
        },
        synchronize_session=False,
    )
    registrar_log(
        db,
        ator,
        "SENHA_REDEFINIDA",
        "USUARIO",
        usuario.id,
        "Senha temporária emitida após solicitação do titular.",
    )
    db.commit()
    return schemas.ResetSenhaResponse(
        notificacao_id=notificacao.id,
        senha_temporaria=senha_temporaria,
        mensagem="Senha temporária gerada. Ela será exibida somente nesta resposta.",
    )