from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth_utils import exigir_perfil

router = APIRouter(
    prefix="/api/equipamentos",
    tags=["Gestão de Equipamentos"],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))]
)

@router.get("/", response_model=list[schemas.EquipamentoResponse])
def listar_equipamentos(db: Session = Depends(get_db)):
    """Retorna todos os equipamentos cadastrados."""
    return db.query(models.Equipamento).all()

@router.post("/", response_model=schemas.EquipamentoResponse)
def criar_equipamento(equip: schemas.EquipamentoCriar, db: Session = Depends(get_db)):
    """Cadastra um novo equipamento vinculado a um laboratório."""
    # RN04: Verifica se o laboratório informado realmente existe
    lab = db.query(models.Laboratorio).filter(models.Laboratorio.id == equip.laboratorio_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratório vinculado não encontrado.")
        
    novo_equip = models.Equipamento(
        nome=equip.nome,
        descricao=equip.descricao,
        laboratorio_id=equip.laboratorio_id,
        status="ATIVO"
    )
    db.add(novo_equip)
    db.commit()
    db.refresh(novo_equip)
    return novo_equip

@router.patch("/{equip_id}/status")
def alternar_status_equipamento(equip_id: str, db: Session = Depends(get_db)):
    """Ativa ou desativa um equipamento no sistema (Soft Delete)."""
    equip = db.query(models.Equipamento).filter(models.Equipamento.id == equip_id).first()
    if not equip:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado.")
        
    equip.status = "INATIVO" if equip.status == "ATIVO" else "ATIVO"
    db.commit()
    return {"mensagem": f"Status do equipamento alterado para {equip.status}."}