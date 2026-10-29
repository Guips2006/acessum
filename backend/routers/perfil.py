from datetime import date, timezone
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from PIL import Image, ImageOps, UnidentifiedImageError

from auth_utils import obter_usuario_logado
from auditoria_service import registrar_log
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/perfil", tags=["Perfil do Usuário"])
AVATAR_DIRECTORY = Path(__file__).resolve().parents[1] / "static" / "avatars"
AVATAR_DIRECTORY.mkdir(parents=True, exist_ok=True)
MAX_AVATAR_BYTES = 5 * 1024 * 1024
MAX_AVATAR_PIXELS = 20_000_000
FORMATOS_AVATAR = {
    "image/jpeg": ("JPEG", ".jpg"),
    "image/png": ("PNG", ".png"),
}


def serializar_perfil(usuario: models.Usuario) -> schemas.PerfilUsuarioResponse:
    return schemas.PerfilUsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        perfil=usuario.perfil,
        avatar_url=usuario.avatar_url,
        ultima_atividade=(
            usuario.ultima_atividade.replace(tzinfo=timezone.utc)
            if usuario.ultima_atividade
            else None
        ),
        status=usuario.status,
        suspensao_ate=(
            usuario.suspensao_ate.replace(tzinfo=timezone.utc)
            if usuario.suspensao_ate
            else None
        ),
        cpf=usuario.cpf,
        rg=usuario.rg,
        data_nascimento=usuario.data_nascimento,
        deve_trocar_senha=usuario.deve_trocar_senha,
    )


def salvar_avatar(conteudo: bytes, content_type: str | None) -> tuple[Path, str]:
    formato_esperado = FORMATOS_AVATAR.get(content_type or "")
    if formato_esperado is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Envie uma imagem PNG ou JPEG.",
        )

    try:
        imagem = Image.open(BytesIO(conteudo))
        if imagem.format != formato_esperado[0]:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="O formato do arquivo não corresponde ao tipo de imagem enviado.",
            )
        imagem.verify()
        imagem = Image.open(BytesIO(conteudo))
        if imagem.width * imagem.height > MAX_AVATAR_PIXELS:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="A imagem excede a resolução máxima permitida.",
            )
        imagem.load()
        imagem = ImageOps.exif_transpose(imagem)
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Não foi possível validar o arquivo de imagem.",
        ) from exc

    formato, extensao = formato_esperado
    nome_arquivo = f"{uuid4().hex}{extensao}"
    caminho = AVATAR_DIRECTORY / nome_arquivo
    if formato == "JPEG":
        imagem = imagem.convert("RGB")
    imagem.save(caminho, format=formato, optimize=True)
    return caminho, f"/static/avatars/{nome_arquivo}"


def remover_avatar_anterior(url: str | None) -> None:
    prefixo = "/static/avatars/"
    if not url or not url.startswith(prefixo):
        return
    nome_arquivo = url.removeprefix(prefixo)
    if Path(nome_arquivo).name != nome_arquivo:
        return
    caminho = AVATAR_DIRECTORY / nome_arquivo
    if caminho.is_file():
        caminho.unlink(missing_ok=True)


@router.patch(
    "/me",
    response_model=schemas.PerfilUsuarioResponse,
)
async def atualizar_meu_perfil(
    nome: str = Form(..., min_length=1, max_length=100),
    cpf: str = Form(..., min_length=11, max_length=14),
    rg: str = Form(..., min_length=5, max_length=30),
    data_nascimento: date = Form(...),
    avatar: UploadFile | None = File(default=None),
    usuario: models.Usuario = Depends(obter_usuario_logado),
    db: Session = Depends(get_db),
):
    try:
        dados = schemas.PerfilUsuarioAtualizar.model_validate(
            {
                "nome": nome,
                "cpf": cpf,
                "rg": rg,
                "data_nascimento": data_nascimento,
            }
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=exc.errors(),
        ) from exc

    cpf_existente = (
        db.query(models.Usuario)
        .filter(
            models.Usuario.cpf == dados.cpf,
            models.Usuario.id != usuario.id,
        )
        .first()
    )
    if cpf_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CPF já cadastrado.",
        )

    avatar_anterior = usuario.avatar_url
    novo_caminho: Path | None = None
    usuario.nome = dados.nome
    usuario.cpf = dados.cpf
    usuario.rg = dados.rg
    usuario.data_nascimento = dados.data_nascimento

    if avatar is not None:
        conteudo = await avatar.read(MAX_AVATAR_BYTES + 1)
        await avatar.close()
        if len(conteudo) > MAX_AVATAR_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="A imagem deve ter no máximo 5 MiB.",
            )
        if not conteudo:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="O arquivo de imagem está vazio.",
            )
        novo_caminho, usuario.avatar_url = salvar_avatar(conteudo, avatar.content_type)

    try:
        registrar_log(
            db,
            usuario,
            "PERFIL_ATUALIZADO",
            "USUARIO",
            usuario.id,
            "Dados do próprio perfil atualizados.",
        )
        db.commit()
    except (IntegrityError, SQLAlchemyError) as exc:
        db.rollback()
        if novo_caminho is not None:
            novo_caminho.unlink(missing_ok=True)
        if isinstance(exc, IntegrityError):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
            detail="CPF já cadastrado.",
            ) from exc
        raise

    db.refresh(usuario)
    if novo_caminho is not None and avatar_anterior != usuario.avatar_url:
        remover_avatar_anterior(avatar_anterior)
    return serializar_perfil(usuario)