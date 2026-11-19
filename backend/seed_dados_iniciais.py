from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models
from database import SessionLocal


CONTAS_DE_TESTE = (
    "admin@acessum.com",
    "aluno@acessum.com",
    "prof@acessum.com",
)
LABORATORIOS_LEGADOS = ("Mack Lab", "comp 1")
CONTAS_PRESERVADAS = {
    "guilherme@acessum.com": ("ADMINISTRADOR", "Guilherme"),
    "rebeca@acessum.com": ("ALUNO", "Rebeca"),
    "arthur@acessum.com": ("PROFESSOR", "Arthur"),
}


def id_seed(chave: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"https://acessum.com/seed/dev-v1/{chave}"))


LABORATORIOS = (
    ("informatica-1", "Laboratório de Informática 1", 32),
    ("redes-sistemas", "Laboratório de Redes e Sistemas", 24),
    ("eletronica-iot", "Laboratório de Eletrônica e IoT", 20),
    ("prototipagem", "Laboratório de Prototipagem", 16),
)

EQUIPAMENTOS = (
    (
        "estacoes-informatica",
        "Estações Dell OptiPlex 7010",
        "Conjunto de 24 estações para programação, análise de dados e atividades de laboratório.",
        "informatica-1",
        "ATIVO",
    ),
    (
        "projetor-epson",
        "Projetor Epson PowerLite X49",
        "Projetor multimédia instalado na sala, com entradas HDMI e VGA.",
        "informatica-1",
        "ATIVO",
    ),
    (
        "switch-tplink",
        "Switch TP-Link TL-SG1024",
        "Switch Gigabit de 24 portas para as bancadas de informática.",
        "informatica-1",
        "ATIVO",
    ),
    (
        "kits-arduino",
        "Kits Arduino Uno R4 WiFi",
        "Conjunto de kits para exercícios de programação e prototipagem com sensores.",
        "informatica-1",
        "ATIVO",
    ),
    (
        "switch-cisco",
        "Switch Cisco Catalyst 2960",
        "Switch gerenciável para práticas de VLAN, spanning tree e configuração de redes.",
        "redes-sistemas",
        "ATIVO",
    ),
    (
        "roteador-cisco",
        "Roteador Cisco ISR 4331",
        "Roteador de laboratório para exercícios de encaminhamento e configuração de interfaces.",
        "redes-sistemas",
        "ATIVO",
    ),
    (
        "access-point-aruba",
        "Access point Aruba AP-515",
        "Ponto de acesso Wi-Fi 6 para práticas de redes sem fio.",
        "redes-sistemas",
        "ATIVO",
    ),
    (
        "firewall-fortinet",
        "Appliance Fortinet FortiGate 60F",
        "Equipamento dedicado para exercícios de firewall e segmentação de rede.",
        "redes-sistemas",
        "ATIVO",
    ),
    (
        "osciloscopio-rigol",
        "Osciloscópio Rigol DS1054Z",
        "Osciloscópio digital de quatro canais; indisponível enquanto aguarda calibração.",
        "eletronica-iot",
        "INATIVO",
    ),
    (
        "fonte-minipa",
        "Fonte de bancada Minipa MPL-3305",
        "Fonte DC regulável para montagem e teste de circuitos eletrônicos.",
        "eletronica-iot",
        "ATIVO",
    ),
    (
        "multimetro-fluke",
        "Multímetro digital Fluke 117",
        "Multímetro para medições de tensão, corrente, resistência e continuidade.",
        "eletronica-iot",
        "ATIVO",
    ),
    (
        "kit-stm32",
        "Placas STM32 Nucleo-F446RE",
        "Conjunto de placas de desenvolvimento para atividades de sistemas embarcados.",
        "eletronica-iot",
        "ATIVO",
    ),
    (
        "impressora-creality",
        "Impressora 3D Creality Ender-3 V3 SE",
        "Impressora FDM para protótipos em PLA, com volume de impressão de 220 x 220 x 250 mm.",
        "prototipagem",
        "ATIVO",
    ),
    (
        "estacao-solda",
        "Estação de solda Hikari HK-936",
        "Estação de solda com controle de temperatura para montagem de protótipos eletrônicos.",
        "prototipagem",
        "ATIVO",
    ),
    (
        "cortadora-laser",
        "Cortadora a laser CO2 de 40 W",
        "Cortadora para chapas finas de MDF e acrílico, utilizada com supervisão.",
        "prototipagem",
        "ATIVO",
    ),
    (
        "ferramentas-prototipagem",
        "Conjunto de ferramentas de bancada",
        "Alicates, chaves, pinças e instrumentos manuais para montagem de protótipos.",
        "prototipagem",
        "ATIVO",
    ),
)


def horario_passado(agora: datetime, dias: int, hora: int) -> datetime:
    dia = agora.date() - timedelta(days=dias)
    return datetime.combine(dia, time(hour=hora), tzinfo=timezone.utc).replace(tzinfo=None)


def proximo_dia_util(agora: datetime, dias: int, hora: int) -> datetime:
    dia = agora.date() + timedelta(days=dias)
    while dia.weekday() >= 5:
        dia += timedelta(days=1)
    return datetime.combine(dia, time(hour=hora), tzinfo=timezone.utc).replace(tzinfo=None)


def remover_dados_legados(db: Session) -> tuple[int, int, int]:
    usuarios_removidos = 0
    laboratorios_removidos = 0
    equipamentos_removidos = 0

    for email in CONTAS_DE_TESTE:
        usuario = (
            db.query(models.Usuario)
            .filter(func.lower(models.Usuario.email) == email)
            .one_or_none()
        )
        if usuario is None:
            continue
        if (
            db.query(models.Reserva.id)
            .filter(models.Reserva.usuario_id == usuario.id)
            .first()
            or db.query(models.RelatoProblema.id)
            .filter(models.RelatoProblema.usuario_id == usuario.id)
            .first()
        ):
            raise RuntimeError(
                f"A conta de demonstração {email} tem reservas ou relatos associados; "
                "nenhum dado foi removido."
            )
        db.delete(usuario)
        usuarios_removidos += 1

    laboratorios = (
        db.query(models.Laboratorio)
        .filter(models.Laboratorio.nome.in_(LABORATORIOS_LEGADOS))
        .all()
    )
    for laboratorio in laboratorios:
        equipamentos = (
            db.query(models.Equipamento)
            .filter(models.Equipamento.laboratorio_id == laboratorio.id)
            .all()
        )
        ids_equipamentos = [equipamento.id for equipamento in equipamentos]
        relato_associado = db.query(models.RelatoProblema.id).filter(
            or_(
                models.RelatoProblema.laboratorio_id == laboratorio.id,
                models.RelatoProblema.equipamento_id.in_(ids_equipamentos),
            )
        ).first()
        if (
            db.query(models.Reserva.id)
            .filter(models.Reserva.laboratorio_id == laboratorio.id)
            .first()
            or relato_associado
        ):
            raise RuntimeError(
                f"O laboratório legado {laboratorio.nome} tem reservas ou relatos associados; "
                "nenhum dado foi removido."
            )
        for equipamento in equipamentos:
            db.delete(equipamento)
            equipamentos_removidos += 1
        db.delete(laboratorio)
        laboratorios_removidos += 1

    return usuarios_removidos, laboratorios_removidos, equipamentos_removidos


def validar_contas_preservadas(db: Session) -> dict[str, models.Usuario]:
    usuarios: dict[str, models.Usuario] = {}
    for email, (perfil, nome) in CONTAS_PRESERVADAS.items():
        usuario = (
            db.query(models.Usuario)
            .filter(func.lower(models.Usuario.email) == email)
            .one_or_none()
        )
        if (
            usuario is None
            or usuario.nome != nome
            or usuario.perfil != perfil
            or usuario.status != "ATIVO"
        ):
            raise RuntimeError(
                f"A conta ativa esperada {email} não foi encontrada; "
                "nenhum dado foi removido."
            )
        usuarios[email] = usuario
    return usuarios


def popular_banco() -> None:
    if Path.cwd().resolve() != Path(__file__).parent.resolve():
        raise RuntimeError("Execute este script a partir da pasta backend.")

    db = SessionLocal()
    try:
        usuarios = validar_contas_preservadas(db)
        removidos = remover_dados_legados(db)

        laboratorios_por_chave: dict[str, models.Laboratorio] = {}
        for chave, nome, capacidade in LABORATORIOS:
            laboratorio = models.Laboratorio(
                id=id_seed(f"laboratorio-{chave}"),
                nome=nome,
                capacidade=capacidade,
                status="ATIVO",
            )
            laboratorios_por_chave[chave] = db.merge(laboratorio)

        equipamentos_por_chave: dict[str, models.Equipamento] = {}
        for chave, nome, descricao, chave_laboratorio, status in EQUIPAMENTOS:
            equipamento = models.Equipamento(
                id=id_seed(f"equipamento-{chave}"),
                nome=nome,
                descricao=descricao,
                laboratorio_id=laboratorios_por_chave[chave_laboratorio].id,
                status=status,
            )
            equipamentos_por_chave[chave] = db.merge(equipamento)

        agora = datetime.now(timezone.utc)
        inicio_concluida = horario_passado(agora, 7, 14)
        fim_concluida = inicio_concluida + timedelta(hours=2)
        inicio_recusada = horario_passado(agora, 5, 10)
        inicio_no_show = horario_passado(agora, 12, 9)
        inicio_cancelada = horario_passado(agora, 3, 15)
        inicio_aprovada = proximo_dia_util(agora, 3, 10)
        inicio_pendente = proximo_dia_util(agora, 4, 14)

        reservas = (
            models.Reserva(
                id=id_seed("reserva-aula-python-concluida"),
                laboratorio_id=laboratorios_por_chave["informatica-1"].id,
                usuario_id=usuarios["rebeca@acessum.com"].id,
                data_inicio=inicio_concluida,
                data_fim=fim_concluida,
                data_fim_real=fim_concluida + timedelta(minutes=8),
                finalidade="Aula prática de programação em Python: estruturas de dados e testes.",
                status="CONCLUIDA",
            ),
            models.Reserva(
                id=id_seed("reserva-redes-recusada"),
                laboratorio_id=laboratorios_por_chave["redes-sistemas"].id,
                usuario_id=usuarios["rebeca@acessum.com"].id,
                data_inicio=inicio_recusada,
                data_fim=inicio_recusada + timedelta(hours=2),
                finalidade="Prática de configuração de VLANs para a turma de redes.",
                status="RECUSADA",
                motivo_recusa="O laboratório já estava reservado para uma atividade curricular.",
            ),
            models.Reserva(
                id=id_seed("reserva-eletronica-no-show"),
                laboratorio_id=laboratorios_por_chave["eletronica-iot"].id,
                usuario_id=usuarios["rebeca@acessum.com"].id,
                data_inicio=inicio_no_show,
                data_fim=inicio_no_show + timedelta(hours=1, minutes=30),
                finalidade="Montagem e teste de circuito com microcontrolador.",
                status="NO_SHOW",
            ),
            models.Reserva(
                id=id_seed("reserva-prototipagem-cancelada"),
                laboratorio_id=laboratorios_por_chave["prototipagem"].id,
                usuario_id=usuarios["rebeca@acessum.com"].id,
                data_inicio=inicio_cancelada,
                data_fim=inicio_cancelada + timedelta(hours=2),
                finalidade="Impressão de suportes para o projeto de automação.",
                status="CANCELADA",
            ),
            models.Reserva(
                id=id_seed("reserva-informatica-aprovada"),
                laboratorio_id=laboratorios_por_chave["informatica-1"].id,
                usuario_id=usuarios["rebeca@acessum.com"].id,
                data_inicio=inicio_aprovada,
                data_fim=inicio_aprovada + timedelta(hours=2),
                finalidade="Sessão de monitoria de algoritmos e revisão de exercícios.",
                status="APROVADA",
            ),
            models.Reserva(
                id=id_seed("reserva-redes-pendente"),
                laboratorio_id=laboratorios_por_chave["redes-sistemas"].id,
                usuario_id=usuarios["arthur@acessum.com"].id,
                data_inicio=inicio_pendente,
                data_fim=inicio_pendente + timedelta(hours=2),
                finalidade="Prática supervisionada de configuração de roteamento.",
                status="PENDENTE",
            ),
        )
        for reserva in reservas:
            db.merge(reserva)

        relatos = (
            models.RelatoProblema(
                id=id_seed("relato-osciloscopio-calibracao"),
                usuario_id=usuarios["arthur@acessum.com"].id,
                equipamento_id=equipamentos_por_chave["osciloscopio-rigol"].id,
                descricao=(
                    "A leitura do canal 2 apresenta variação acima do esperado. "
                    "Equipamento separado para calibração antes de novo uso."
                ),
                nivel_severidade="MEDIA",
                status="ABERTO",
                data_hora=agora.replace(tzinfo=None) - timedelta(days=2),
            ),
            models.RelatoProblema(
                id=id_seed("relato-ponto-de-rede"),
                usuario_id=usuarios["rebeca@acessum.com"].id,
                laboratorio_id=laboratorios_por_chave["redes-sistemas"].id,
                descricao=(
                    "O ponto de rede da bancada 6 perde conectividade durante "
                    "transferências prolongadas."
                ),
                nivel_severidade="ALTA",
                status="ABERTO",
                data_hora=agora.replace(tzinfo=None) - timedelta(days=1),
            ),
            models.RelatoProblema(
                id=id_seed("relato-projetor-cabo"),
                usuario_id=usuarios["rebeca@acessum.com"].id,
                equipamento_id=equipamentos_por_chave["projetor-epson"].id,
                descricao="Cabo HDMI com mau contato; substituído e testado pela equipe técnica.",
                nivel_severidade="BAIXA",
                status="RESOLVIDO",
                data_hora=agora.replace(tzinfo=None) - timedelta(days=4),
            ),
        )
        for relato in relatos:
            db.merge(relato)

        db.commit()
        print(
            "Carga concluída: "
            f"{removidos[0]} contas de demonstração, "
            f"{removidos[1]} laboratórios genéricos e "
            f"{removidos[2]} equipamentos removidos; "
            f"{len(LABORATORIOS)} laboratórios, {len(EQUIPAMENTOS)} equipamentos, "
            f"{len(reservas)} reservas e {len(relatos)} relatos carregados."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    popular_banco()
