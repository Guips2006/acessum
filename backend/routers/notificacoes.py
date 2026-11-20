from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth_utils import obter_usuario_logado
from database import get_db
import models

router = APIRouter(prefix="/api/notificacoes", tags=["Notificações"])


class NotificacaoResponse(BaseModel):
    id: str
    reserva_id: str | None
    tipo: str
    titulo: str
    mensagem: str
    criada_em: datetime
    lida: bool


class ListaNotificacoesResponse(BaseModel):
    notificacoes: list[NotificacaoResponse]
    nao_lidas: int


class NotificacoesLidasResponse(BaseModel):
    atualizadas: int


def serializar_notificacao(notificacao: models.Notificacao) -> NotificacaoResponse:
    return NotificacaoResponse(
        id=notificacao.id,
        reserva_id=notificacao.reserva_id,
        tipo=notificacao.tipo,
        titulo=notificacao.titulo,
        mensagem=notificacao.mensagem,
        criada_em=notificacao.criada_em.replace(tzinfo=timezone.utc),
        lida=notificacao.lida,
    )


def serializar_notificacao_conta(notificacao: models.NotificacaoConta) -> NotificacaoResponse:
    return NotificacaoResponse(
        id=notificacao.id,
        reserva_id=None,
        tipo=notificacao.tipo,
        titulo=notificacao.titulo,
        mensagem=notificacao.mensagem,
        criada_em=notificacao.criada_em.replace(tzinfo=timezone.utc),
        lida=notificacao.lida,
    )


@router.get("", response_model=ListaNotificacoesResponse)
def listar_notificacoes(
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    consulta = db.query(models.Notificacao).filter(
        models.Notificacao.usuario_id == usuario.id
    )
    nao_lidas = consulta.filter(models.Notificacao.lida.is_(False)).count()
    notificacoes = [
        serializar_notificacao(notificacao)
        for notificacao in (
        consulta.order_by(models.Notificacao.criada_em.desc(), models.Notificacao.id.desc())
        .limit(50)
        .all()
        )
    ]
    if usuario.perfil == "ADMINISTRADOR":
        consulta_conta = db.query(models.NotificacaoConta).filter(
            models.NotificacaoConta.destinatario_id == usuario.id
        )
        nao_lidas += consulta_conta.filter(models.NotificacaoConta.lida.is_(False)).count()
        notificacoes.extend(
            serializar_notificacao_conta(notificacao)
            for notificacao in consulta_conta.order_by(
                models.NotificacaoConta.criada_em.desc(),
                models.NotificacaoConta.id.desc(),
            ).limit(50).all()
        )
    notificacoes.sort(key=lambda notificacao: notificacao.criada_em, reverse=True)
    notificacoes = notificacoes[:50]
    return ListaNotificacoesResponse(
        notificacoes=notificacoes,
        nao_lidas=nao_lidas,
    )


@router.patch("/lidas", response_model=NotificacoesLidasResponse)
def marcar_todas_como_lidas(
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    atualizadas = (
        db.query(models.Notificacao)
        .filter(
            models.Notificacao.usuario_id == usuario.id,
            models.Notificacao.lida.is_(False),
        )
        .update({"lida": True}, synchronize_session=False)
    )
    if usuario.perfil == "ADMINISTRADOR":
        atualizadas += (
            db.query(models.NotificacaoConta)
            .filter(
                models.NotificacaoConta.destinatario_id == usuario.id,
                models.NotificacaoConta.lida.is_(False),
            )
            .update({"lida": True}, synchronize_session=False)
        )
    db.commit()
    return NotificacoesLidasResponse(atualizadas=atualizadas)


@router.patch("/{notificacao_id}/lida", response_model=NotificacaoResponse)
def marcar_como_lida(
    notificacao_id: str,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    notificacao = (
        db.query(models.Notificacao)
        .filter(
            models.Notificacao.id == notificacao_id,
            models.Notificacao.usuario_id == usuario.id,
        )
        .first()
    )
    if notificacao is None:
        if usuario.perfil == "ADMINISTRADOR":
            notificacao_conta = (
                db.query(models.NotificacaoConta)
                .filter(
                    models.NotificacaoConta.id == notificacao_id,
                    models.NotificacaoConta.destinatario_id == usuario.id,
                )
                .first()
            )
            if notificacao_conta is not None:
                notificacao_conta.lida = True
                db.commit()
                db.refresh(notificacao_conta)
                return serializar_notificacao_conta(notificacao_conta)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificação não encontrada.")
    notificacao.lida = True
    db.commit()
    db.refresh(notificacao)
    return serializar_notificacao(notificacao)