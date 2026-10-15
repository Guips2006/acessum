from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth_utils import exigir_perfil

# Protege todas as rotas deste ficheiro para uso exclusivo do Administrador
router = APIRouter(
    prefix="/api/laboratorios",
    tags=["Gestão de Laboratórios"],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))]
)

@router.get("/", response_model=list[schemas.LaboratorioResponse])
def listar_laboratorios(db: Session = Depends(get_db)):
    """Retorna todos os laboratórios cadastrados."""
    return db.query(models.Laboratorio).all()

@router.post("/", response_model=schemas.LaboratorioResponse)
def criar_laboratorio(lab: schemas.LaboratorioCriar, db: Session = Depends(get_db)):
    """Cadastra um novo laboratório."""
    if db.query(models.Laboratorio).filter(models.Laboratorio.nome == lab.nome).first():
        raise HTTPException(status_code=400, detail="Laboratório com este nome já existe.")
        
    novo_lab = models.Laboratorio(
        nome=lab.nome,
        capacidade=lab.capacidade,
        status="ATIVO"
    )
    db.add(novo_lab)
    db.commit()
    db.refresh(novo_lab)
    return novo_lab

@router.patch("/{lab_id}/status")
def alternar_status_laboratorio(lab_id: str, db: Session = Depends(get_db)):
    """Ativa ou desativa um laboratório no sistema (Soft Delete)."""
    lab = db.query(models.Laboratorio).filter(models.Laboratorio.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratório não encontrado.")
        
    # Alterna entre ATIVO e INATIVO
    lab.status = "INATIVO" if lab.status == "ATIVO" else "ATIVO"
    db.commit()
    
    return {"mensagem": f"Status do laboratório alterado para {lab.status}."}