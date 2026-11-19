from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario
from auth_utils import verify_password, create_token, obter_usuario_logado
import schemas

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

class DadosLogin(BaseModel):
    email: str = Field(description="E-mail cadastrado na plataforma.")
    senha: str = Field(description="Senha da conta.")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "email": "ana.martins@example.org",
                    "senha": "ExemploForte#2026",
                }
            ]
        }
    )


@router.post(
    "/login",
    response_model=schemas.LoginResponse,
    summary="Iniciar sessão",
    description="Valida as credenciais e devolve um JWT válido por 24 horas.",
    responses={401: {"description": "Credenciais inválidas ou conta inativa."}},
)
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

@router.get(
    "/me",
    response_model=schemas.UsuarioLogadoResponse,
    summary="Consultar sessão atual",
    responses={
        401: {"description": "Token inválido ou expirado."},
        403: {"description": "Cabeçalho de autenticação ausente."},
    },
)
def meu_perfil(usuario: Usuario = Depends(obter_usuario_logado)):
    return {"id": usuario.id, "nome": usuario.nome, "email": usuario.email, "perfil": usuario.perfil}