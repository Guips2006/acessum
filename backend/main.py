import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timezone

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from database import engine, Base, get_db, SessionLocal
from migrations import aplicar_migracoes
from routers import auth, usuarios, laboratorios, equipamentos, problemas, reservas
import models
from auth_utils import get_password_hash
from reservas_lifecycle import marcar_reservas_no_show

logger = logging.getLogger(__name__)
INTERVALO_NO_SHOW_SEGUNDOS = 60


def processar_reservas_no_show() -> int:
    with SessionLocal() as db:
        agora_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        return marcar_reservas_no_show(db, agora_utc)


async def tarefa_no_show() -> None:
    while True:
        try:
            await asyncio.to_thread(processar_reservas_no_show)
        except SQLAlchemyError:
            logger.exception("Falha ao marcar reservas expiradas como NO_SHOW.")
        await asyncio.sleep(INTERVALO_NO_SHOW_SEGUNDOS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    tarefa = asyncio.create_task(tarefa_no_show())
    try:
        yield
    finally:
        tarefa.cancel()
        with suppress(asyncio.CancelledError):
            await tarefa


Base.metadata.create_all(bind=engine)
aplicar_migracoes(engine)

app = FastAPI(title="Acessum API", lifespan=lifespan)

# --- CONFIGURAÇÃO DE CORS ATUALIZADA ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O asterisco permite requisições de qualquer URL do Codespaces
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(laboratorios.router)
app.include_router(equipamentos.router)
app.include_router(problemas.router)
app.include_router(reservas.router)

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