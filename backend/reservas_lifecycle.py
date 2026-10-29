from datetime import datetime, timedelta

from sqlalchemy.orm import Session

import models

JANELA_PENALIDADE = timedelta(days=30)
DURACAO_SUSPENSAO = timedelta(days=7)
LIMITE_NO_SHOWS = 3


def aplicar_penalidade_no_show(
    db: Session,
    usuario_id: str,
    agora_utc: datetime,
) -> bool:
    usuario = (
        db.query(models.Usuario)
        .filter(models.Usuario.id == usuario_id)
        .first()
    )
    if usuario is None or usuario.perfil != "ALUNO" or usuario.status != "ATIVO":
        return False

    inicio_janela = agora_utc - JANELA_PENALIDADE
    quantidade_no_shows = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.usuario_id == usuario_id,
            models.Reserva.status == "NO_SHOW",
            models.Reserva.data_no_show >= inicio_janela,
            models.Reserva.data_no_show <= agora_utc,
        )
        .count()
    )
    if quantidade_no_shows < LIMITE_NO_SHOWS:
        return False

    usuario.status = "SUSPENSO"
    usuario.suspensao_ate = agora_utc + DURACAO_SUSPENSAO
    return True


def reavaliar_suspensao_expirada(
    db: Session,
    usuario: models.Usuario,
    agora_utc: datetime,
) -> None:
    if (
        usuario.status != "SUSPENSO"
        or usuario.suspensao_ate is None
        or usuario.suspensao_ate > agora_utc
    ):
        return

    usuario.status = "ATIVO"
    usuario.suspensao_ate = None
    db.flush()
    aplicar_penalidade_no_show(db, usuario.id, agora_utc)


def registrar_no_show(
    db: Session,
    reserva_id: str,
    usuario_id: str,
    agora_utc: datetime,
) -> bool:
    atualizada = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.id == reserva_id,
            models.Reserva.usuario_id == usuario_id,
            models.Reserva.status == "APROVADA",
        )
        .update(
            {"status": "NO_SHOW", "data_no_show": agora_utc},
            synchronize_session=False,
        )
    )
    if not atualizada:
        return False

    db.flush()
    aplicar_penalidade_no_show(db, usuario_id, agora_utc)
    return True


def marcar_reservas_no_show(db: Session, agora_utc: datetime) -> int:
    limite = agora_utc - timedelta(minutes=15)
    expiradas = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.status == "APROVADA",
            models.Reserva.data_inicio < limite,
        )
        .all()
    )
    atualizadas = 0
    for reserva in expiradas:
        if registrar_no_show(db, reserva.id, reserva.usuario_id, agora_utc):
            atualizadas += 1
    db.commit()
    return atualizadas
