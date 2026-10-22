from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from database import get_db
import models, schemas
from auth_utils import exigir_perfil, obter_usuario_logado

router = APIRouter(prefix="/api/laboratorios", tags=["Laboratórios"])

@router.get(
    "/",
    response_model=list[schemas.LaboratorioResponse],
    dependencies=[Depends(obter_usuario_logado)],
)
def listar_laboratorios(db: Session = Depends(get_db)):
    """Lista os laboratórios para qualquer usuário autenticado."""
    return (
        db.query(models.Laboratorio)
        .options(selectinload(models.Laboratorio.equipamentos))
        .order_by(models.Laboratorio.nome)
        .all()
    )

@router.post(
    "/",
    response_model=schemas.LaboratorioResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
def criar_laboratorio(lab: schemas.LaboratorioCriar, db: Session = Depends(get_db)):
    """Cadastra um novo laboratório."""
    nome_existente = db.query(models.Laboratorio).filter(
        func.lower(models.Laboratorio.nome) == lab.nome.lower()
    ).first()
    if nome_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um laboratório com este nome.",
        )

    novo_lab = models.Laboratorio(
        nome=lab.nome,
        capacidade=lab.capacidade,
        status="ATIVO",
    )
    db.add(novo_lab)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um laboratório com este nome.",
        ) from exc
    db.refresh(novo_lab)
    return novo_lab

@router.patch(
    "/{lab_id}/status",
    response_model=schemas.LaboratorioStatusResponse,
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
def alternar_status_laboratorio(lab_id: str, db: Session = Depends(get_db)):
    """Ativa ou desativa um laboratório no sistema (Soft Delete)."""
    lab = db.query(models.Laboratorio).filter(models.Laboratorio.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado.",
        )
    if lab.status not in {"ATIVO", "INATIVO"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O laboratório possui um status inválido e não pode ser alterado.",
        )

    lab.status = "INATIVO" if lab.status == "ATIVO" else "ATIVO"
    db.commit()
    return {"id": lab.id, "novo_status": lab.status}