from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from reservas_lifecycle import reavaliar_suspensao_expirada
import models

SECRET_KEY = "chave-secreta-simples-para-teste"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, perfil: str):
    vencimento = datetime.utcnow() + timedelta(hours=24)
    # Colocamos o ID (sub) e o perfil dentro do Token
    to_encode = {"sub": user_id, "perfil": perfil, "exp": vencimento}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def obter_usuario_logado(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extrai a string do token fornecida no Swagger ou no Frontend
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if user is None or user.status == "INATIVO":
        raise HTTPException(status_code=401, detail="Usuário inativo ou não encontrado")

    rotas_troca_obrigatoria = {
        "/api/auth/me",
        "/api/auth/alterar-senha",
        "/api/perfil/me",
    }
    if user.deve_trocar_senha and request.url.path not in rotas_troca_obrigatoria:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Altere sua senha temporária antes de continuar.",
        )

    agora_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    reavaliar_suspensao_expirada(db, user, agora_utc)
    user.ultima_atividade = agora_utc
    db.commit()
    
    return user

# --- O NOVO "LEÃO DE CHÁCARA" BASEADO EM PERFIL ---
def exigir_perfil(perfis_permitidos: list[str]):
    def verificador(usuario: models.Usuario = Depends(obter_usuario_logado)):
        if usuario.perfil not in perfis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado. Seu perfil não tem permissão para esta ação."
            )
        return usuario
    return verificador