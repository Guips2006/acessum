from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth_utils import exigir_perfil, get_password_hash

# O router aplica a proteção de Administrador em todos os endpoints automaticamente
router = APIRouter(
    prefix="/api/usuarios",
    tags=["Gestão de Usuários"],
    dependencies=[Depends(exigir_perfil(["ADMINISTRADOR"]))]
)

@router.get("/", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    """Lista todos os usuários cadastrados no sistema."""
    return db.query(models.Usuario).all()

@router.post("/", response_model=schemas.UsuarioResponse)
def criar_usuario(usuario: schemas.UsuarioCriar, db: Session = Depends(get_db)):
    """Cadastra um novo usuário (Aluno, Professor ou Administrador)."""
    if db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        
    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=get_password_hash(usuario.senha),
        perfil=usuario.perfil,
        status="ATIVO"
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@router.patch("/{usuario_id}/status")
def alternar_status(usuario_id: str, db: Session = Depends(get_db)):
    """Ativa ou inativa um usuário (Soft Delete)."""
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    usuario.status = "INATIVO" if usuario.status == "ATIVO" else "ATIVO"
    db.commit()
    return {"id": usuario.id, "novo_status": usuario.status}