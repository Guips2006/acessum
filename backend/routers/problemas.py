from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth_utils import exigir_perfil, obter_usuario_logado
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/problemas", tags=["Relatos de Problemas"])


def serializar_relato(relato: models.RelatoProblema) -> dict:
    if relato.laboratorio is not None:
        tipo_recurso = "LABORATORIO"
        recurso_id = relato.laboratorio.id
        recurso_nome = relato.laboratorio.nome
    elif relato.equipamento is not None:
        tipo_recurso = "EQUIPAMENTO"
        recurso_id = relato.equipamento.id
        recurso_nome = relato.equipamento.nome
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="O relato está sem recurso associado.",
        )

    return {
        "id": relato.id,
        "usuario_id": relato.usuario_id,
        "usuario_nome": relato.usuario.nome,
        "tipo_recurso": tipo_recurso,
        "recurso_id": recurso_id,
        "recurso_nome": recurso_nome,
        "descricao": relato.descricao,
        "nivel_severidade": relato.nivel_severidade,
        "status": relato.status,
        "data_hora": relato.data_hora,
    }


@router.post(
    "/",
    response_model=schemas.RelatoProblemaResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_relato_problema(
    dados: schemas.RelatoProblemaCriar,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Registra um problema associado a um laboratório ou equipamento."""
    if usuario.perfil not in {"ALUNO", "PROFESSOR"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos e professores podem reportar problemas.",
        )

    valores_recurso = {"laboratorio_id": None, "equipamento_id": None}
    if dados.tipo_recurso == "LABORATORIO":
        recurso = db.query(models.Laboratorio).filter(
            models.Laboratorio.id == dados.recurso_id
        ).first()
        valores_recurso["laboratorio_id"] = dados.recurso_id
    else:
        recurso = db.query(models.Equipamento).filter(
            models.Equipamento.id == dados.recurso_id
        ).first()
        valores_recurso["equipamento_id"] = dados.recurso_id

    if recurso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso não encontrado.",
        )

    relato = models.RelatoProblema(
        usuario_id=usuario.id,
        descricao=dados.descricao,
        nivel_severidade=dados.nivel_severidade,
        status="ABERTO",
        **valores_recurso,
    )
    db.add(relato)
    db.commit()
    db.refresh(relato)
    relato = (
        db.query(models.RelatoProblema)
        .options(
            joinedload(models.RelatoProblema.usuario),
            joinedload(models.RelatoProblema.laboratorio),
            joinedload(models.RelatoProblema.equipamento),
        )
        .filter(models.RelatoProblema.id == relato.id)
        .one()
    )
    return serializar_relato(relato)


@router.get(
    "/",
    response_model=list[schemas.RelatoProblemaResponse],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
def listar_relatos_problema(db: Session = Depends(get_db)):
    """Lista os relatos para o painel administrativo."""
    relatos = (
        db.query(models.RelatoProblema)
        .options(
            joinedload(models.RelatoProblema.usuario),
            joinedload(models.RelatoProblema.laboratorio),
            joinedload(models.RelatoProblema.equipamento),
        )
        .order_by(models.RelatoProblema.data_hora.desc())
        .all()
    )
    return [serializar_relato(relato) for relato in relatos]


@router.patch(
    "/{relato_id}/status",
    response_model=schemas.RelatoProblemaResponse,
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
def atualizar_status_relato(
    relato_id: str,
    dados: schemas.RelatoProblemaStatusAtualizar,
    db: Session = Depends(get_db),
):
    """Atualiza o status de um relato no painel administrativo."""
    relato = (
        db.query(models.RelatoProblema)
        .options(
            joinedload(models.RelatoProblema.usuario),
            joinedload(models.RelatoProblema.laboratorio),
            joinedload(models.RelatoProblema.equipamento),
        )
        .filter(models.RelatoProblema.id == relato_id)
        .first()
    )
    if relato is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relato de problema não encontrado.",
        )

    relato.status = dados.status
    db.commit()
    db.refresh(relato)
    return serializar_relato(relato)
