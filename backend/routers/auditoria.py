from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth_utils import exigir_perfil
from database import get_db
import models

router = APIRouter(
    prefix="/api/auditoria",
    tags=["Auditoria"],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)


class LogAuditoriaResponse(BaseModel):
    id: str
    usuario_id: str
    usuario_nome: str
    usuario_perfil: str
    acao: str
    entidade: str
    entidade_id: str
    descricao: str
    data_hora: datetime


class ListaLogsAuditoriaResponse(BaseModel):
    logs: list[LogAuditoriaResponse]
    total: int
    limite: int
    deslocamento: int


@router.get("", response_model=ListaLogsAuditoriaResponse)
def listar_logs_auditoria(
    acao: str | None = Query(default=None, max_length=50),
    usuario_id: str | None = Query(default=None, max_length=36),
    entidade: str | None = Query(default=None, max_length=30),
    data_inicio: datetime | None = Query(default=None),
    data_fim: datetime | None = Query(default=None),
    limite: int = Query(default=100, ge=1, le=500),
    deslocamento: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    if (data_inicio is None) != (data_fim is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Informe data_inicio e data_fim juntos.",
        )

    consulta = (
        db.query(models.LogAuditoria, models.Usuario.nome, models.Usuario.perfil)
        .join(models.Usuario, models.Usuario.id == models.LogAuditoria.usuario_id)
    )
    if acao:
        consulta = consulta.filter(models.LogAuditoria.acao == acao)
    if usuario_id:
        consulta = consulta.filter(models.LogAuditoria.usuario_id == usuario_id)
    if entidade:
        consulta = consulta.filter(models.LogAuditoria.entidade == entidade)
    if data_inicio is not None and data_fim is not None:
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
        consulta = consulta.filter(
            models.LogAuditoria.data_hora >= inicio,
            models.LogAuditoria.data_hora < fim,
        )

    total = consulta.count()
    resultados = (
        consulta.order_by(models.LogAuditoria.data_hora.desc(), models.LogAuditoria.id.desc())
        .offset(deslocamento)
        .limit(limite)
        .all()
    )
    return ListaLogsAuditoriaResponse(
        logs=[
            LogAuditoriaResponse(
                id=log.id,
                usuario_id=log.usuario_id,
                usuario_nome=nome,
                usuario_perfil=perfil,
                acao=log.acao,
                entidade=log.entidade,
                entidade_id=log.entidade_id,
                descricao=log.descricao,
                data_hora=log.data_hora.replace(tzinfo=timezone.utc),
            )
            for log, nome, perfil in resultados
        ],
        total=total,
        limite=limite,
        deslocamento=deslocamento,
    )