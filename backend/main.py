import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from database import engine, Base, SessionLocal
from migrations import aplicar_migracoes
from routers import (
    auth,
    auditoria,
    dashboard,
    equipamentos,
    laboratorios,
    notificacoes,
    notificacoes_conta,
    perfil,
    problemas,
    relatorios,
    reservas,
    usuarios,
)
import schemas
from reservas_lifecycle import marcar_reservas_no_show
from notificacoes_service import gerar_lembretes_checkin

logger = logging.getLogger(__name__)
INTERVALO_NO_SHOW_SEGUNDOS = 60


def processar_ciclo_reservas() -> int:
    with SessionLocal() as db:
        agora_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        atualizadas = marcar_reservas_no_show(db, agora_utc)
        gerar_lembretes_checkin(db, agora_utc)
        return atualizadas


async def tarefa_no_show() -> None:
    while True:
        try:
            await asyncio.to_thread(processar_ciclo_reservas)
        except SQLAlchemyError:
            logger.exception("Falha ao processar o ciclo periódico de reservas.")
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

app = FastAPI(
    title="Acessum API",
    description=(
        "API de gestão de acesso e utilização de laboratórios. "
        "As rotas protegidas utilizam JWT no esquema Bearer."
    ),
    version="0.1.0",
    openapi_tags=[
        {"name": "Autenticação", "description": "Login, sessão e perfil autenticado."},
        {"name": "Gestão de Usuários", "description": "Cadastro e estado das contas."},
        {"name": "Laboratórios", "description": "Consulta e gestão dos laboratórios."},
        {"name": "Equipamentos", "description": "Consulta e gestão dos equipamentos."},
        {"name": "Reservas", "description": "Disponibilidade, solicitações e utilização."},
        {"name": "Relatos de Problemas", "description": "Registro e acompanhamento de ocorrências."},
        {"name": "Sistema", "description": "Estado e informações gerais da API."},
    ],
    lifespan=lifespan,
)
app.mount(
    "/static/avatars",
    StaticFiles(directory=perfil.AVATAR_DIRECTORY),
    name="avatars",
)

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
app.include_router(perfil.router)
app.include_router(dashboard.router)
app.include_router(relatorios.router)
app.include_router(notificacoes.router)
app.include_router(notificacoes_conta.router)
app.include_router(auditoria.router)

@app.get(
    "/",
    response_model=schemas.HealthResponse,
    tags=["Sistema"],
    summary="Verificar estado da API",
)
def home() -> schemas.HealthResponse:
    return schemas.HealthResponse(mensagem="API Rodando perfeitamente!")