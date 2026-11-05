from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from auth_utils import exigir_perfil, obter_usuario_logado
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/favoritos",
    tags=["Laboratórios Favoritos"],
    dependencies=[Depends(exigir_perfil(["ALUNO", "PROFESSOR"]))],
)


def serializar_favorito(favorito: models.FavoritoUsuario) -> schemas.FavoritoResponse:
    laboratorio = favorito.laboratorio
    return schemas.FavoritoResponse(
        id=laboratorio.id,
        nome=laboratorio.nome,
        capacidade=laboratorio.capacidade,
        status=laboratorio.status,
    )


@router.get("", response_model=list[schemas.FavoritoResponse])
def listar_favoritos(
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    favoritos = (
        db.query(models.FavoritoUsuario)
        .options(joinedload(models.FavoritoUsuario.laboratorio))
        .filter(models.FavoritoUsuario.usuario_id == usuario.id)
        .join(models.Laboratorio)
        .order_by(models.Laboratorio.nome)
        .all()
    )
    return [serializar_favorito(favorito) for favorito in favoritos]


@router.put("/{laboratorio_id}", response_model=schemas.FavoritoResponse)
def adicionar_favorito(
    laboratorio_id: str,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    laboratorio = (
        db.query(models.Laboratorio)
        .filter(models.Laboratorio.id == laboratorio_id)
        .first()
    )
    if laboratorio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado.",
        )

    favorito = (
        db.query(models.FavoritoUsuario)
        .options(joinedload(models.FavoritoUsuario.laboratorio))
        .filter(
            models.FavoritoUsuario.usuario_id == usuario.id,
            models.FavoritoUsuario.laboratorio_id == laboratorio_id,
        )
        .first()
    )
    if favorito is not None:
        return serializar_favorito(favorito)

    favorito = models.FavoritoUsuario(
        usuario_id=usuario.id,
        laboratorio_id=laboratorio_id,
    )
    db.add(favorito)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não foi possível adicionar este laboratório aos favoritos.",
        ) from exc
    db.refresh(favorito)
    return serializar_favorito(favorito)


@router.delete("/{laboratorio_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_favorito(
    laboratorio_id: str,
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    favorito = (
        db.query(models.FavoritoUsuario)
        .filter(
            models.FavoritoUsuario.usuario_id == usuario.id,
            models.FavoritoUsuario.laboratorio_id == laboratorio_id,
        )
        .first()
    )
    if favorito is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado nos favoritos.",
        )
    db.delete(favorito)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
