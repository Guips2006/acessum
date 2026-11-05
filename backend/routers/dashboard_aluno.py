from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from auth_utils import exigir_perfil, obter_usuario_logado
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/dashboard/aluno",
    tags=["Dashboard do Aluno"],
    dependencies=[Depends(exigir_perfil(["ALUNO"]))],
)

LIMITE_NO_SHOWS = 3
JANELA_NO_SHOWS = timedelta(days=30)
JANELA_CHECKIN_ANTES = timedelta(minutes=30)
JANELA_CHECKIN_DEPOIS = timedelta(minutes=15)


@router.get("/resumo", response_model=schemas.DashboardAlunoResponse)
def obter_resumo_aluno(
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    inicio_janela = agora - JANELA_NO_SHOWS
    faltas = (
        db.query(models.Reserva.id)
        .filter(
            models.Reserva.usuario_id == usuario.id,
            models.Reserva.status == "NO_SHOW",
            models.Reserva.data_no_show >= inicio_janela,
            models.Reserva.data_no_show <= agora,
        )
        .count()
    )
    reservas_checkin = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.laboratorio))
        .filter(
            models.Reserva.usuario_id == usuario.id,
            models.Reserva.status == "APROVADA",
            models.Reserva.data_inicio >= agora - JANELA_CHECKIN_DEPOIS,
            models.Reserva.data_inicio <= agora + JANELA_CHECKIN_ANTES,
        )
        .order_by(models.Reserva.data_inicio)
        .all()
    )

    return schemas.DashboardAlunoResponse(
        faltas_no_periodo=faltas,
        limite_no_show=LIMITE_NO_SHOWS,
        faltas_restantes=max(0, LIMITE_NO_SHOWS - faltas),
        status_conta=usuario.status,
        suspensao_ate=(
            usuario.suspensao_ate.replace(tzinfo=timezone.utc)
            if usuario.suspensao_ate
            else None
        ),
        reservas_checkin=[
            schemas.ReservaCheckinProximoResponse(
                id=reserva.id,
                laboratorio_nome=reserva.laboratorio.nome,
                data_inicio=reserva.data_inicio.replace(tzinfo=timezone.utc),
            )
            for reserva in reservas_checkin
        ],
    )
