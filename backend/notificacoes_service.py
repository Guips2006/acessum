from datetime import datetime, timedelta

from sqlalchemy.orm import Session, joinedload, selectinload

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


def criar_notificacoes_co_reservantes(
    db: Session,
    reserva: models.Reserva,
    tipo: str,
    titulo: str,
    mensagem: str,
) -> int:
    criadas = 0
    for vinculo in reserva.co_reservantes:
        existente = (
            db.query(models.NotificacaoGrupo.id)
            .filter(
                models.NotificacaoGrupo.reserva_id == reserva.id,
                models.NotificacaoGrupo.usuario_id == vinculo.usuario_id,
                models.NotificacaoGrupo.tipo == tipo,
            )
            .first()
        )
        if existente:
            continue
        db.add(
            models.NotificacaoGrupo(
                usuario_id=vinculo.usuario_id,
                reserva_id=reserva.id,
                tipo=tipo,
                titulo=titulo,
                mensagem=mensagem,
            )
        )
        criadas += 1
    return criadas


def gerar_lembretes_checkin(db: Session, agora_utc: datetime) -> int:
    limite = agora_utc + JANELA_LEMBRETE_CHECKIN
    reservas = (
        db.query(models.Reserva)
        .options(
            joinedload(models.Reserva.laboratorio),
            joinedload(models.Reserva.usuario),
            selectinload(models.Reserva.co_reservantes),
        )
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
        criadas += criar_notificacoes_co_reservantes(
            db,
            reserva=reserva,
            tipo="CHECKIN_30_MIN",
            titulo="Check-in em breve",
            mensagem=(
                f"A reserva em {reserva.laboratorio.nome} da qual você participa "
                "começa em até 30 minutos."
            ),
        )
    if criadas:
        db.commit()
    return criadas