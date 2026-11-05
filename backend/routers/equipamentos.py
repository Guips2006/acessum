from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth_utils import exigir_perfil, obter_usuario_logado

router = APIRouter(prefix="/api/equipamentos", tags=["Equipamentos"])

@router.get(
    "/",
    response_model=list[schemas.EquipamentoResponse],
    dependencies=[Depends(obter_usuario_logado)],
)
def listar_equipamentos(db: Session = Depends(get_db)):
    """Lista os equipamentos para qualquer usuário autenticado."""
    return db.query(models.Equipamento).order_by(models.Equipamento.nome).all()

@router.post(
    "/",
    response_model=schemas.EquipamentoResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
def criar_equipamento(equip: schemas.EquipamentoCriar, db: Session = Depends(get_db)):
    """Cadastra um novo equipamento vinculado a um laboratório."""
    lab = db.query(models.Laboratorio).filter(
        models.Laboratorio.id == equip.laboratorio_id
    ).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório vinculado não encontrado.",
        )
    if lab.status != "ATIVO":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível cadastrar equipamentos em um laboratório inativo.",
        )

    novo_equip = models.Equipamento(
        nome=equip.nome,
        descricao=equip.descricao,
        laboratorio_id=equip.laboratorio_id,
        status="ATIVO",
    )
    db.add(novo_equip)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        laboratorio = db.query(models.Laboratorio).filter(
            models.Laboratorio.id == equip.laboratorio_id
        ).first()
        if laboratorio is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="O laboratório vinculado não existe mais.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não foi possível cadastrar o equipamento devido a um conflito de integridade.",
        ) from exc
    db.refresh(novo_equip)
    return novo_equip

@router.patch(
    "/{equip_id}/status",
    response_model=schemas.EquipamentoStatusResponse,
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))],
)
def alternar_status_equipamento(equip_id: str, db: Session = Depends(get_db)):
    """Ativa ou desativa logicamente um equipamento."""
    equip = db.query(models.Equipamento).filter(models.Equipamento.id == equip_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipamento não encontrado.",
        )
    if equip.status not in {"ATIVO", "INATIVO"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O equipamento possui um status inválido e não pode ser alterado.",
        )

    equip.status = "INATIVO" if equip.status == "ATIVO" else "ATIVO"
    db.commit()
    return {"id": equip.id, "novo_status": equip.status}