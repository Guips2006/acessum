from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from auth_utils import exigir_perfil, obter_usuario_logado
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/alunos",
    tags=["Busca de Alunos"],
    dependencies=[Depends(exigir_perfil(["ALUNO"]))],
)


@router.get("/busca", response_model=list[schemas.AlunoResumoResponse])
def buscar_alunos(
    termo: str = Query(min_length=2, max_length=100),
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    termo_normalizado = termo.strip()
    if len(termo_normalizado) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Informe pelo menos dois caracteres para buscar alunos.",
        )
    termo_escapado = (
        termo_normalizado.replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )

    alunos = (
        db.query(models.Usuario)
        .filter(
            models.Usuario.id != usuario.id,
            models.Usuario.perfil == "ALUNO",
            models.Usuario.status == "ATIVO",
            or_(
                models.Usuario.nome.ilike(f"%{termo_escapado}%", escape="\\"),
                models.Usuario.email.ilike(f"%{termo_escapado}%", escape="\\"),
            ),
        )
        .order_by(models.Usuario.nome, models.Usuario.id)
        .limit(10)
        .all()
    )
    return [
        schemas.AlunoResumoResponse(id=aluno.id, nome=aluno.nome, email=aluno.email)
        for aluno in alunos
    ]
