from datetime import datetime, timedelta

from sqlalchemy.orm import Session, joinedload

import models

JANELA_LEMBRETE_CHECKIN = timedelta(minutes=30)


def criar_notificacao(
    db: Session,
    usuario_id: str,
    reserva_id: str,
    tipo: str,
    titulo: str,
    mensagem: str,
) -> models.Notificacao | None:
    existente = (
        db.query(models.Notificacao.id)
        .filter(
            models.Notificacao.reserva_id == reserva_id,
            models.Notificacao.tipo == tipo,
        )
        .first()
    )
    if existente:
        return None

    notificacao = models.Notificacao(
        usuario_id=usuario_id,
        reserva_id=reserva_id,
        tipo=tipo,
        titulo=titulo,
        mensagem=mensagem,
    )
    db.add(notificacao)
    return notificacao


def gerar_lembretes_checkin(db: Session, agora_utc: datetime) -> int:
    limite = agora_utc + JANELA_LEMBRETE_CHECKIN
    reservas = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.laboratorio), joinedload(models.Reserva.usuario))
        .join(models.Usuario, models.Usuario.id == models.Reserva.usuario_id)
        .filter(
            models.Reserva.status == "APROVADA",
            models.Reserva.data_inicio > agora_utc,
            models.Reserva.data_inicio <= limite,
            models.Usuario.perfil == "ALUNO",
        )
        .all()
    )

    criadas = 0
    for reserva in reservas:
        notificacao = criar_notificacao(
            db,
            usuario_id=reserva.usuario_id,
            reserva_id=reserva.id,
            tipo="CHECKIN_30_MIN",
            titulo="Check-in em breve",
            mensagem=f"Sua reserva em {reserva.laboratorio.nome} começa em até 30 minutos.",
        )
        if notificacao:
            criadas += 1
    if criadas:
        db.commit()
    return criadas