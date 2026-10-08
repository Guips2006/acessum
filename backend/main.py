from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from routers import auth
import models
from auth_utils import get_password_hash

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Acessum API")

# --- CONFIGURAÇÃO DE CORS ATUALIZADA ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O asterisco permite requisições de qualquer URL do Codespaces
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
def home():
    return {"mensagem": "API Rodando perfeitamente!"}

@app.get("/setup")
def setup_inicial(db: Session = Depends(get_db)):
    # Verifica se já tem o admin, se tiver, avisa que já foi feito
    if db.query(models.Usuario).count() >= 3:
        return {"msg": "Todos os usuários de teste já existem. Vá testar o login!"}
        
    # Deleta tudo (só pra desenvolvimento) para garantir que criaremos os 3 certinhos
    db.query(models.Usuario).delete()
    
    usuarios_teste = [
        models.Usuario(
            nome="Admin Master", email="admin@acessum.com", 
            senha_hash=get_password_hash("admin123"), perfil="ADMINISTRADOR"
        ),
        models.Usuario(
            nome="Professora Mariana", email="prof@acessum.com", 
            senha_hash=get_password_hash("prof123"), perfil="PROFESSOR"
        ),
        models.Usuario(
            nome="Aluno Lucas", email="aluno@acessum.com", 
            senha_hash=get_password_hash("aluno123"), perfil="ALUNO"
        )
    ]
    
    db.add_all(usuarios_teste)
    db.commit()
    return {"msg": "Contas admin@, prof@ e aluno@ criadas com sucesso! As senhas são o nome do perfil + 123"}