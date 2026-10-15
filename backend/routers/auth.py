from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario
from auth_utils import verify_password, create_token, obter_usuario_logado

router = APIRouter(prefix="/api/auth")

class DadosLogin(BaseModel):
    email: str
    senha: str

@router.post("/login")
def login(dados: DadosLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == dados.email).first()
    
    if not user or not verify_password(dados.senha, user.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if user.status != "ATIVO":
        raise HTTPException(status_code=401, detail="Usuário inativo ou bloqueado.")
        
    token = create_token(user.id, user.perfil)
    
    return {
        "token": token, 
        "nome": user.nome, 
        "email": user.email, 
        "perfil": user.perfil
    }

@router.get("/me")
def meu_perfil(usuario: Usuario = Depends(obter_usuario_logado)):
    return {"id": usuario.id, "nome": usuario.nome, "email": usuario.email, "perfil": usuario.perfil}