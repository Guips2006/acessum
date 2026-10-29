from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from auth_utils import exigir_perfil, obter_usuario_logado
from auditoria_service import registrar_log
from database import get_db
from notificacoes_service import criar_notificacao
from reservas_lifecycle import registrar_no_show
import models
import schemas

router = APIRouter(prefix="/api/reservas", tags=["Reservas"])
STATUS_CANCELAVEIS = ("PENDENTE", "APROVADA")
JANELA_CHECKIN = timedelta(minutes=15)


def normalizar_utc(data: datetime, nome_parametro: str) -> datetime:
    if data.tzinfo is None or data.utcoffset() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{nome_parametro} deve incluir fuso horário.",
        )
    return data.astimezone(timezone.utc).replace(tzinfo=None)


def serializar_reserva_analise(reserva: models.Reserva) -> schemas.ReservaAnaliseResponse:
    return schemas.ReservaAnaliseResponse(
        id=reserva.id,
        usuario_id=reserva.usuario_id,
        usuario_nome=reserva.usuario.nome,
        laboratorio_id=reserva.laboratorio_id,
        laboratorio_nome=reserva.laboratorio.nome,
        data_inicio=reserva.data_inicio.replace(tzinfo=timezone.utc),
        data_fim=reserva.data_fim.replace(tzinfo=timezone.utc),
        finalidade=reserva.finalidade,
        status=reserva.status,
        motivo_recusa=reserva.motivo_recusa,
    )


def serializar_reserva_historico(reserva: models.Reserva) -> schemas.ReservaHistoricoResponse:
    return schemas.ReservaHistoricoResponse(
        id=reserva.id,
        laboratorio_id=reserva.laboratorio_id,
        laboratorio_nome=reserva.laboratorio.nome,
        data_inicio=reserva.data_inicio.replace(tzinfo=timezone.utc),
        data_fim=reserva.data_fim.replace(tzinfo=timezone.utc),
        finalidade=reserva.finalidade,
        status=reserva.status,
        motivo_recusa=reserva.motivo_recusa,
        data_fim_real=(
            reserva.data_fim_real.replace(tzinfo=timezone.utc)
            if reserva.data_fim_real is not None
            else None
        ),
    )


@router.get(
    "/disponibilidade",
    response_model=schemas.DisponibilidadeResponse,
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)
def consultar_disponibilidade(
    recurso_id: str = Query(min_length=1, max_length=36),
    data_inicio: datetime = Query(),
    data_fim: datetime = Query(),
    db: Session = Depends(get_db),
):
    """Calcula intervalos livres e ocupados de um laboratório no período."""
    inicio = normalizar_utc(data_inicio, "data_inicio")
    fim = normalizar_utc(data_fim, "data_fim")
    if fim <= inicio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="data_fim deve ser posterior a data_inicio.",
        )

    laboratorio = db.query(models.Laboratorio).filter(
        models.Laboratorio.id == recurso_id
    ).first()
    if laboratorio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado.",
        )
    if laboratorio.status != "ATIVO":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível consultar disponibilidade de um laboratório inativo.",
        )

    reservas = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.laboratorio_id == laboratorio.id,
            models.Reserva.status.in_(("APROVADA", "EM_USO")),
            models.Reserva.data_inicio < fim,
            models.Reserva.data_fim > inicio,
        )
        .order_by(models.Reserva.data_inicio, models.Reserva.data_fim)
        .all()
    )

    ocupados: list[tuple[datetime, datetime]] = []
    for reserva in reservas:
        bloco_inicio = max(reserva.data_inicio, inicio)
        bloco_fim = min(reserva.data_fim, fim)
        if ocupados and bloco_inicio <= ocupados[-1][1]:
            ocupados[-1] = (ocupados[-1][0], max(ocupados[-1][1], bloco_fim))
        else:
            ocupados.append((bloco_inicio, bloco_fim))

    livres: list[tuple[datetime, datetime]] = []
    cursor = inicio
    for bloco_inicio, bloco_fim in ocupados:
        if cursor < bloco_inicio:
            livres.append((cursor, bloco_inicio))
        cursor = max(cursor, bloco_fim)
    if cursor < fim:
        livres.append((cursor, fim))

    def bloco(inicio_bloco: datetime, fim_bloco: datetime) -> schemas.BlocoDisponibilidade:
        return schemas.BlocoDisponibilidade(
            inicio=inicio_bloco.replace(tzinfo=timezone.utc),
            fim=fim_bloco.replace(tzinfo=timezone.utc),
        )

    return schemas.DisponibilidadeResponse(
        recurso=schemas.RecursoDisponibilidade(id=laboratorio.id, nome=laboratorio.nome),
        periodo=bloco(inicio, fim),
        blocos_livres=[bloco(bloco_inicio, bloco_fim) for bloco_inicio, bloco_fim in livres],
        blocos_ocupados=[bloco(bloco_inicio, bloco_fim) for bloco_inicio, bloco_fim in ocupados],
    )


@router.get(
    "/minhas-reservas",
    response_model=list[schemas.ReservaHistoricoResponse],
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)
def listar_minhas_reservas(
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Lista somente as reservas pertencentes ao utilizador autenticado."""
    reservas = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.laboratorio))
        .filter(models.Reserva.usuario_id == usuario.id)
        .order_by(models.Reserva.data_inicio.desc(), models.Reserva.id)
        .all()
    )
    return [serializar_reserva_historico(reserva) for reserva in reservas]


@router.get(
    "/pendentes",
    response_model=list[schemas.ReservaAnaliseResponse],
    dependencies=[Depends(exigir_perfil(["PROFESSOR"]))],
)
def listar_reservas_pendentes(db: Session = Depends(get_db)):
    """Lista as solicitações de reserva que aguardam análise do professor."""
    reservas = (
        db.query(models.Reserva)
        .options(
            joinedload(models.Reserva.usuario),
            joinedload(models.Reserva.laboratorio),
        )
        .filter(models.Reserva.status == "PENDENTE")
        .order_by(models.Reserva.data_inicio, models.Reserva.id)
        .all()
    )
    return [serializar_reserva_analise(reserva) for reserva in reservas]


@router.patch(
    "/{reserva_id}/analise",
    response_model=schemas.ReservaAnaliseResponse,
    dependencies=[Depends(exigir_perfil(["PROFESSOR"]))],
)
def analisar_reserva(
    reserva_id: str,
    dados: schemas.ReservaAnaliseAtualizar,
    ator: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Aprova ou recusa uma solicitação pendente após validar o estado atual."""
    reserva = (
        db.query(models.Reserva)
        .options(
            joinedload(models.Reserva.usuario),
            joinedload(models.Reserva.laboratorio),
        )
        .filter(models.Reserva.id == reserva_id)
        .first()
    )
    if reserva is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada.",
        )
    if reserva.status != "PENDENTE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reserva já foi analisada e não está mais pendente.",
        )

    if dados.status == "APROVADA":
        if reserva.laboratorio.status != "ATIVO":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Não é possível aprovar uma reserva de laboratório inativo.",
            )
        conflito = (
            db.query(models.Reserva.id)
            .filter(
                models.Reserva.id != reserva.id,
                models.Reserva.laboratorio_id == reserva.laboratorio_id,
                models.Reserva.status.in_(("APROVADA", "EM_USO")),
                models.Reserva.data_inicio < reserva.data_fim,
                models.Reserva.data_fim > reserva.data_inicio,
            )
            .first()
        )
        if conflito:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A reserva não pode ser aprovada porque existe outra reserva aprovada ou em uso nesse período.",
            )
        reserva.motivo_recusa = None
    else:
        reserva.motivo_recusa = dados.motivo_recusa

    reserva.status = dados.status
    if reserva.usuario.perfil == "ALUNO":
        aprovada = dados.status == "APROVADA"
        criar_notificacao(
            db,
            usuario_id=reserva.usuario_id,
            reserva_id=reserva.id,
            tipo="RESERVA_APROVADA" if aprovada else "RESERVA_RECUSADA",
            titulo="Reserva aprovada" if aprovada else "Reserva recusada",
            mensagem=(
                f"Sua reserva em {reserva.laboratorio.nome} foi "
                f"{'aprovada' if aprovada else 'recusada'}."
            ),
        )
    aprovada = dados.status == "APROVADA"
    registrar_log(
        db,
        ator,
        "RESERVA_APROVADA" if aprovada else "RESERVA_RECUSADA",
        "RESERVA",
        reserva.id,
        f"Reserva {dados.status.lower()} para o laboratório {reserva.laboratorio.nome}.",
    )
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(reserva)
    return serializar_reserva_analise(reserva)


@router.patch(
    "/{reserva_id}/cancelar",
    response_model=schemas.ReservaHistoricoResponse,
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)
def cancelar_reserva(
    reserva_id: str,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Cancela uma reserva própria até uma hora antes do seu início."""
    reserva = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.laboratorio))
        .filter(
            models.Reserva.id == reserva_id,
            models.Reserva.usuario_id == usuario.id,
        )
        .first()
    )
    if reserva is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada.",
        )
    if reserva.status not in STATUS_CANCELAVEIS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível cancelar uma reserva pendente ou aprovada.",
        )

    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    if reserva.data_inicio < agora + timedelta(hours=1):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O cancelamento só pode ser feito até uma hora antes do início da reserva.",
        )

    reserva.status = "CANCELADA"
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(reserva)
    return serializar_reserva_historico(reserva)


@router.patch(
    "/{reserva_id}/checkin",
    response_model=schemas.ReservaHistoricoResponse,
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)
def fazer_checkin(
    reserva_id: str,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Regista o início de uma reserva própria dentro da janela de check-in."""
    reserva = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.laboratorio))
        .filter(
            models.Reserva.id == reserva_id,
            models.Reserva.usuario_id == usuario.id,
        )
        .first()
    )
    if reserva is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada.",
        )
    if reserva.status != "APROVADA":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível fazer check-in de uma reserva aprovada.",
        )

    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    inicio_janela = reserva.data_inicio - JANELA_CHECKIN
    fim_janela = reserva.data_inicio + JANELA_CHECKIN
    if agora < inicio_janela:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O check-in só pode ser feito a partir de 15 minutos antes do início da reserva.",
        )

    if agora > fim_janela:
        if registrar_no_show(db, reserva.id, usuario.id, agora):
            try:
                db.commit()
            except SQLAlchemyError:
                db.rollback()
                raise
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A janela de check-in expirou; a reserva foi marcada como NO_SHOW.",
            )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reserva já não está aprovada para check-in.",
        )

    resultado = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.id == reserva.id,
            models.Reserva.usuario_id == usuario.id,
            models.Reserva.status == "APROVADA",
        )
        .update({"status": "EM_USO"}, synchronize_session=False)
    )
    if not resultado:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reserva já não está aprovada para check-in.",
        )
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(reserva)
    return serializar_reserva_historico(reserva)


@router.patch(
    "/{reserva_id}/encerrar",
    response_model=schemas.ReservaHistoricoResponse,
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)
def encerrar_reserva(
    reserva_id: str,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Encerra uma reserva própria em uso e regista o horário efetivo."""
    reserva = (
        db.query(models.Reserva)
        .options(joinedload(models.Reserva.laboratorio))
        .filter(
            models.Reserva.id == reserva_id,
            models.Reserva.usuario_id == usuario.id,
        )
        .first()
    )
    if reserva is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada.",
        )
    if reserva.status != "EM_USO":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível encerrar uma reserva que esteja em uso.",
        )

    fim_real = datetime.now(timezone.utc).replace(tzinfo=None)
    atualizada = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.id == reserva.id,
            models.Reserva.usuario_id == usuario.id,
            models.Reserva.status == "EM_USO",
        )
        .update(
            {"status": "CONCLUIDA", "data_fim_real": fim_real},
            synchronize_session=False,
        )
    )
    if not atualizada:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reserva já não está em uso.",
        )
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(reserva)
    return serializar_reserva_historico(reserva)


@router.post(
    "/",
    response_model=schemas.ReservaResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)
def solicitar_reserva(
    dados: schemas.ReservaCriar,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Registra uma solicitação pendente de reserva de laboratório."""
    if usuario.status == "SUSPENSO":
        prazo = (
            usuario.suspensao_ate.replace(tzinfo=timezone.utc).isoformat()
            if usuario.suspensao_ate
            else "prazo indeterminado"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Sua conta está suspensa até {prazo}; novas reservas não são permitidas.",
        )

    inicio = normalizar_utc(dados.data_inicio, "data_inicio")
    fim = normalizar_utc(dados.data_fim, "data_fim")
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    if inicio <= agora:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A data de início da reserva deve estar no futuro.",
        )
    if fim <= inicio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="data_fim deve ser posterior a data_inicio.",
        )

    laboratorio = db.query(models.Laboratorio).filter(
        models.Laboratorio.id == dados.recurso_id
    ).first()
    if laboratorio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado.",
        )
    if laboratorio.status != "ATIVO":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível reservar um laboratório inativo.",
        )

    conflito = (
        db.query(models.Reserva.id)
        .filter(
            models.Reserva.laboratorio_id == laboratorio.id,
            models.Reserva.status.in_(("APROVADA", "EM_USO")),
            models.Reserva.data_inicio < fim,
            models.Reserva.data_fim > inicio,
        )
        .first()
    )
    if conflito:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O laboratório já possui uma reserva aprovada ou em uso nesse período.",
        )

    reserva = models.Reserva(
        laboratorio_id=laboratorio.id,
        usuario_id=usuario.id,
        data_inicio=inicio,
        data_fim=fim,
        finalidade=dados.finalidade,
        status="PENDENTE",
    )
    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    return schemas.ReservaResponse(
        id=reserva.id,
        usuario_id=reserva.usuario_id,
        laboratorio_id=laboratorio.id,
        laboratorio_nome=laboratorio.nome,
        data_inicio=reserva.data_inicio.replace(tzinfo=timezone.utc),
        data_fim=reserva.data_fim.replace(tzinfo=timezone.utc),
        finalidade=reserva.finalidade,
        status=reserva.status,
    )
