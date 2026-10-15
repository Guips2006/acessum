from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models

SECRET_KEY = "chave-secreta-simples-para-teste"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, perfil: str):
    vencimento = datetime.utcnow() + timedelta(hours=24)
    # Colocamos o ID (sub) e o perfil dentro do Token
    to_encode = {"sub": user_id, "perfil": perfil, "exp": vencimento}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def obter_usuario_logado(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if user is None or user.status != "ATIVO":
        raise HTTPException(status_code=401, detail="Usuário inativo ou não encontrado")
    
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