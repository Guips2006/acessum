from datetime import datetime, timezone

from sqlalchemy.orm import Session

import models


def registrar_log(
    db: Session,
    ator: models.Usuario,
    acao: str,
    entidade: str,
    entidade_id: str,
    descricao: str,
) -> models.LogAuditoria:
    log = models.LogAuditoria(
        usuario_id=ator.id,
        acao=acao,
        entidade=entidade,
        entidade_id=entidade_id,
        descricao=descricao,
        data_hora=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(log)
    return log