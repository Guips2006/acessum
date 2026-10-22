from datetime import datetime, timedelta

from sqlalchemy.orm import Session

import models


def marcar_reservas_no_show(db: Session, agora_utc: datetime) -> int:
    limite = agora_utc - timedelta(minutes=15)
    atualizadas = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.status == "APROVADA",
            models.Reserva.data_inicio < limite,
        )
        .update({"status": "NO_SHOW"}, synchronize_session=False)
    )
    db.commit()
    return atualizadas
