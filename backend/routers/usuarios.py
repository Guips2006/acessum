from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auditoria_service import registrar_log
from auth_utils import exigir_perfil, get_password_hash, obter_usuario_logado

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
def criar_usuario(
    usuario: schemas.UsuarioCriar,
    ator: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Cadastra um novo usuário (Aluno, Professor ou Administrador)."""
    email_existente = db.query(models.Usuario).filter(
        func.lower(models.Usuario.email) == usuario.email
    ).first()
    if email_existente:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")
    cpf_existente = db.query(models.Usuario.id).filter(models.Usuario.cpf == usuario.cpf).first()
    if cpf_existente:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF já cadastrado.")
        
    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        cpf=usuario.cpf,
        rg=usuario.rg,
        data_nascimento=usuario.data_nascimento,
        senha_hash=get_password_hash(usuario.senha),
        perfil=usuario.perfil,
        status="ATIVO"
    )
    db.add(novo_usuario)
    try:
        db.flush()
        registrar_log(
            db,
            ator,
            "USUARIO_CRIADO",
            "USUARIO",
            novo_usuario.id,
            f"Usuário criado com perfil {novo_usuario.perfil}.",
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail ou CPF já cadastrado.",
        ) from exc
    db.refresh(novo_usuario)
    return novo_usuario

@router.patch(
    "/{usuario_id}/status",
    response_model=schemas.UsuarioStatusResponse,
)
def alternar_status(
    usuario_id: str,
    ator: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    """Ativa ou inativa um usuário (Soft Delete)."""
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    if usuario.status == "INATIVO":
        usuario.status = "ATIVO"
    else:
        usuario.status = "INATIVO"
        usuario.suspensao_ate = None
    acao = "USUARIO_ATIVADO" if usuario.status == "ATIVO" else "USUARIO_INATIVADO"
    registrar_log(
        db,
        ator,
        acao,
        "USUARIO",
        usuario.id,
        f"Status do usuário alterado para {usuario.status}.",
    )
    db.commit()
    return {"id": usuario.id, "novo_status": usuario.status}