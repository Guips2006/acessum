from datetime import date, datetime, time, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth_utils import exigir_perfil
from database import get_db
import models

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard Administrativo"],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
STATUS_RESERVA = (
    "PENDENTE",
    "APROVADA",
    "RECUSADA",
    "EM_USO",
    "CONCLUIDA",
    "CANCELADA",
    "NO_SHOW",
)
STATUS_OCUPACAO = ("APROVADA", "EM_USO", "CONCLUIDA")


class ReservaPorStatus(BaseModel):
    status: Literal[
        "PENDENTE",
        "APROVADA",
        "RECUSADA",
        "EM_USO",
        "CONCLUIDA",
        "CANCELADA",
        "NO_SHOW",
    ]
    quantidade: int


class NoShowPorDia(BaseModel):
    data: date
    quantidade: int


class DashboardReservasResponse(BaseModel):
    data_inicio: datetime
    data_fim: datetime
    taxa_ocupacao: float
    reservas_por_status: list[ReservaPorStatus]
    evolucao_no_shows: list[NoShowPorDia]


def normalizar_periodo(
    data_inicio: datetime | None,
    data_fim: datetime | None,
) -> tuple[datetime, datetime]:
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    if data_inicio is None and data_fim is None:
        return agora - timedelta(days=30), agora
    if data_inicio is None or data_fim is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Informe data_inicio e data_fim juntos.",
        )
    if (
        data_inicio.tzinfo is None
        or data_inicio.utcoffset() is None
        or data_fim.tzinfo is None
        or data_fim.utcoffset() is None
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="As datas devem incluir fuso horário.",
        )

    inicio = data_inicio.astimezone(timezone.utc).replace(tzinfo=None)
    fim = data_fim.astimezone(timezone.utc).replace(tzinfo=None)
    if fim <= inicio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="data_fim deve ser posterior a data_inicio.",
        )
    if fim - inicio > timedelta(days=366):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="O período máximo do dashboard é de 366 dias.",
        )
    return inicio, fim


def calcular_horas_ocupadas(
    reservas: list[models.Reserva],
    inicio: datetime,
    fim: datetime,
) -> float:
    intervalos_por_laboratorio: dict[str, list[tuple[datetime, datetime]]] = {}
    for reserva in reservas:
        fim_reserva = (
            reserva.data_fim_real
            if reserva.status == "CONCLUIDA" and reserva.data_fim_real
            else reserva.data_fim
        )
        inicio_intervalo = max(reserva.data_inicio, inicio)
        fim_intervalo = min(fim_reserva, fim)
        if fim_intervalo <= inicio_intervalo:
            continue
        intervalos_por_laboratorio.setdefault(reserva.laboratorio_id, []).append(
            (inicio_intervalo, fim_intervalo)
        )

    segundos_ocupados = 0.0
    for intervalos in intervalos_por_laboratorio.values():
        intervalos.sort(key=lambda intervalo: intervalo[0])
        inicio_atual, fim_atual = intervalos[0]
        for proximo_inicio, proximo_fim in intervalos[1:]:
            if proximo_inicio <= fim_atual:
                fim_atual = max(fim_atual, proximo_fim)
                continue
            segundos_ocupados += (fim_atual - inicio_atual).total_seconds()
            inicio_atual, fim_atual = proximo_inicio, proximo_fim
        segundos_ocupados += (fim_atual - inicio_atual).total_seconds()
    return segundos_ocupados / 3600


@router.get("/reservas", response_model=DashboardReservasResponse)
def obter_dashboard_reservas(
    data_inicio: datetime | None = Query(default=None),
    data_fim: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Retorna ocupação, reservas por status e no-shows diários para o período."""
    inicio, fim = normalizar_periodo(data_inicio, data_fim)
    inicio_utc = inicio.replace(tzinfo=timezone.utc)
    fim_utc = fim.replace(tzinfo=timezone.utc)

    totais_por_status = dict(
        db.query(models.Reserva.status, func.count(models.Reserva.id))
        .filter(
            models.Reserva.data_inicio >= inicio,
            models.Reserva.data_inicio < fim,
        )
        .group_by(models.Reserva.status)
        .all()
    )
    reservas_por_status = [
        ReservaPorStatus(status=estado, quantidade=totais_por_status.get(estado, 0))
        for estado in STATUS_RESERVA
    ]

    laboratorios_ativos = db.query(models.Laboratorio.id).filter(
        models.Laboratorio.status == "ATIVO"
    ).all()
    ids_laboratorios_ativos = [laboratorio.id for laboratorio in laboratorios_ativos]
    reservas_ocupacao = []
    if ids_laboratorios_ativos:
        reservas_ocupacao = (
            db.query(models.Reserva)
            .filter(
                models.Reserva.laboratorio_id.in_(ids_laboratorios_ativos),
                models.Reserva.status.in_(STATUS_OCUPACAO),
                models.Reserva.data_inicio < fim,
                models.Reserva.data_fim > inicio,
            )
            .all()
        )
    horas_ocupadas = calcular_horas_ocupadas(reservas_ocupacao, inicio, fim)
    horas_disponiveis = len(laboratorios_ativos) * (fim - inicio).total_seconds() / 3600
    taxa_ocupacao = round(horas_ocupadas / horas_disponiveis * 100, 2) if horas_disponiveis else 0.0

    primeiro_dia = inicio.date()
    ultimo_instante = fim - timedelta(microseconds=1)
    ultimo_dia = ultimo_instante.date()
    contagem_no_show = dict(
        db.query(func.date(models.Reserva.data_no_show), func.count(models.Reserva.id))
        .filter(
            models.Reserva.status == "NO_SHOW",
            models.Reserva.data_no_show >= inicio,
            models.Reserva.data_no_show < fim,
        )
        .group_by(func.date(models.Reserva.data_no_show))
        .all()
    )
    evolucao_no_shows = []
    dia_atual = primeiro_dia
    while dia_atual <= ultimo_dia:
        evolucao_no_shows.append(
            NoShowPorDia(data=dia_atual, quantidade=contagem_no_show.get(dia_atual.isoformat(), 0))
        )
        dia_atual += timedelta(days=1)

    return DashboardReservasResponse(
        data_inicio=inicio_utc,
        data_fim=fim_utc,
        taxa_ocupacao=taxa_ocupacao,
        reservas_por_status=reservas_por_status,
        evolucao_no_shows=evolucao_no_shows,
    )