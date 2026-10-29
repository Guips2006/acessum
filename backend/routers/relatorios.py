import csv
import io
from datetime import datetime, timezone, timedelta
from html import escape
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from auth_utils import exigir_perfil, obter_usuario_logado
from database import get_db
import models

router = APIRouter(prefix="/api/relatorios", tags=["Relatórios"])
MAXIMO_RESERVAS_EXPORTACAO = 10_000
STATUS_RESERVA = Literal[
    "PENDENTE",
    "APROVADA",
    "RECUSADA",
    "EM_USO",
    "CONCLUIDA",
    "CANCELADA",
    "NO_SHOW",
]
FormatoRelatorio = Literal["csv", "pdf"]


def normalizar_periodo(
    data_inicio: datetime | None,
    data_fim: datetime | None,
) -> tuple[datetime | None, datetime | None]:
    if data_inicio is None and data_fim is None:
        return None, None
    if data_inicio is None or data_fim is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Informe data_inicio e data_fim juntos.",
        )
    if (
        data_inicio.tzinfo is None
        or data_inicio.utcoffset() is None
        or data_fim.tzinfo is None
        or data_fim.utcoffset() is None
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="As datas devem incluir fuso horário.",
        )

    inicio = data_inicio.astimezone(timezone.utc).replace(tzinfo=None)
    fim = data_fim.astimezone(timezone.utc).replace(tzinfo=None)
    if fim <= inicio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="data_fim deve ser posterior a data_inicio.",
        )
    if fim - inicio > timedelta(days=366):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="O período máximo do relatório é de 366 dias.",
        )
    return inicio, fim


def consultar_reservas(
    db: Session,
    data_inicio: datetime | None,
    data_fim: datetime | None,
    status_reserva: str | None,
    usuario_id: str | None,
):
    inicio, fim = normalizar_periodo(data_inicio, data_fim)
    consulta = (
        db.query(models.Reserva, models.Laboratorio.nome, models.Usuario.nome)
        .join(models.Laboratorio, models.Reserva.laboratorio_id == models.Laboratorio.id)
        .join(models.Usuario, models.Reserva.usuario_id == models.Usuario.id)
    )
    if usuario_id is not None:
        consulta = consulta.filter(models.Reserva.usuario_id == usuario_id)
    if inicio is not None and fim is not None:
        consulta = consulta.filter(
            models.Reserva.data_inicio >= inicio,
            models.Reserva.data_inicio < fim,
        )
    if status_reserva is not None:
        consulta = consulta.filter(models.Reserva.status == status_reserva)

    reservas = (
        consulta.order_by(models.Reserva.data_inicio.desc(), models.Reserva.id)
        .limit(MAXIMO_RESERVAS_EXPORTACAO + 1)
        .all()
    )
    if len(reservas) > MAXIMO_RESERVAS_EXPORTACAO:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="O relatório excede 10.000 reservas. Reduza o período ou aplique um filtro de status.",
        )
    return reservas


def formatar_data(data: datetime) -> str:
    return data.replace(tzinfo=timezone.utc).strftime("%d/%m/%Y %H:%M UTC")


def gerar_csv(reservas, incluir_solicitante: bool) -> bytes:
    arquivo = io.StringIO(newline="")
    escritor = csv.writer(arquivo, lineterminator="\n")
    colunas = ["Laboratório"]
    if incluir_solicitante:
        colunas.append("Solicitante")
    colunas.extend(["Início", "Fim", "Finalidade", "Status", "Motivo da recusa"])
    escritor.writerow(colunas)

    for reserva, laboratorio_nome, usuario_nome in reservas:
        linha = [laboratorio_nome]
        if incluir_solicitante:
            linha.append(usuario_nome)
        linha.extend([
            formatar_data(reserva.data_inicio),
            formatar_data(reserva.data_fim),
            reserva.finalidade,
            reserva.status,
            reserva.motivo_recusa or "",
        ])
        escritor.writerow(linha)
    return arquivo.getvalue().encode("utf-8-sig")


def gerar_pdf(reservas, incluir_solicitante: bool) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    arquivo = io.BytesIO()
    documento = SimpleDocTemplate(
        arquivo,
        pagesize=landscape(A4),
        rightMargin=12 * mm,
        leftMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )
    estilos = getSampleStyleSheet()
    estilo_titulo = ParagraphStyle(
        "TituloRelatorioAcessum",
        parent=estilos["Title"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=15,
        textColor=colors.HexColor("#172235"),
        spaceAfter=8 * mm,
    )
    estilo_celula = ParagraphStyle(
        "CelulaRelatorioAcessum",
        parent=estilos["BodyText"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
    )
    estilo_cabecalho = ParagraphStyle(
        "CabecalhoRelatorioAcessum",
        parent=estilo_celula,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )
    titulos = ["Laboratório"]
    if incluir_solicitante:
        titulos.append("Solicitante")
    titulos.extend(["Início", "Fim", "Finalidade", "Status", "Motivo da recusa"])
    dados = [[Paragraph(escape(titulo), estilo_cabecalho) for titulo in titulos]]

    for reserva, laboratorio_nome, usuario_nome in reservas:
        linha = [laboratorio_nome]
        if incluir_solicitante:
            linha.append(usuario_nome)
        linha.extend([
            formatar_data(reserva.data_inicio),
            formatar_data(reserva.data_fim),
            reserva.finalidade,
            reserva.status,
            reserva.motivo_recusa or "",
        ])
        dados.append([
            Paragraph(escape(str(valor)).replace("\n", "<br/>"), estilo_celula)
            for valor in linha
        ])

    larguras = [35 * mm]
    if incluir_solicitante:
        larguras.append(33 * mm)
    larguras.extend([29 * mm, 29 * mm, 78 * mm, 24 * mm, 45 * mm])
    tabela = Table(dados, colWidths=larguras, repeatRows=1, hAlign="LEFT")
    tabela.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#162a4b")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d6dce5")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6f9")]),
    ]))
    documento.build([
        Paragraph("Relatório de reservas — Acessum", estilo_titulo),
        Paragraph(f"Gerado em {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')}", estilos["Normal"]),
        Spacer(1, 4 * mm),
        tabela,
    ])
    return arquivo.getvalue()


def resposta_relatorio(reservas, formato: FormatoRelatorio, incluir_solicitante: bool) -> Response:
    agora = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    if formato == "csv":
        conteudo = gerar_csv(reservas, incluir_solicitante)
        media_type = "text/csv; charset=utf-8"
    else:
        conteudo = gerar_pdf(reservas, incluir_solicitante)
        media_type = "application/pdf"
    return Response(
        content=conteudo,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="reservas-{agora}.{formato}"'},
    )


@router.get("/reservas")
def exportar_reservas_admin(
    formato: FormatoRelatorio = Query(default="csv"),
    data_inicio: datetime | None = Query(default=None),
    data_fim: datetime | None = Query(default=None),
    status_reserva: STATUS_RESERVA | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(exigir_perfil(["ADMINISTRADOR"])),
):
    reservas = consultar_reservas(db, data_inicio, data_fim, status_reserva, None)
    return resposta_relatorio(reservas, formato, incluir_solicitante=True)


@router.get("/minhas-reservas")
def exportar_minhas_reservas(
    formato: FormatoRelatorio = Query(default="csv"),
    data_inicio: datetime | None = Query(default=None),
    data_fim: datetime | None = Query(default=None),
    status_reserva: STATUS_RESERVA | None = Query(default=None, alias="status"),
    usuario: models.Usuario = Depends(exigir_perfil(["ALUNO", "PROFESSOR"])),
    db: Session = Depends(get_db),
):
    reservas = consultar_reservas(
        db,
        data_inicio,
        data_fim,
        status_reserva,
        usuario.id,
    )
    return resposta_relatorio(reservas, formato, incluir_solicitante=False)