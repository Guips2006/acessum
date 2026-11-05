import unittest
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

import models
import schemas
from migrations import aplicar_migracoes
from notificacoes_service import gerar_lembretes_checkin
from routers.alunos import buscar_alunos
from routers.dashboard_aluno import obter_resumo_aluno
from routers.favoritos import adicionar_favorito, listar_favoritos, remover_favorito
from routers.notificacoes import listar_notificacoes, marcar_como_lida
from routers.reservas import (
    analisar_reserva,
    consultar_grade_semanal,
    fazer_checkin,
    listar_minhas_reservas,
    solicitar_reserva,
)


class FuncionalidadesAlunoTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        aplicar_migracoes(self.engine)
        models.Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.aluno = models.Usuario(
            id="aluno-1",
            nome="Ana Estudante",
            email="ana@example.com",
            senha_hash="hash",
            perfil="ALUNO",
            status="ATIVO",
        )
        self.co_reservante = models.Usuario(
            id="aluno-2",
            nome="Bruno Estudante",
            email="bruno@example.com",
            senha_hash="hash",
            perfil="ALUNO",
            status="ATIVO",
        )
        self.professor = models.Usuario(
            id="prof-1",
            nome="Professora",
            email="prof@example.com",
            senha_hash="hash",
            perfil="PROFESSOR",
            status="ATIVO",
        )
        self.laboratorio = models.Laboratorio(
            id="lab-1",
            nome="Laboratório Central",
            capacidade=20,
            status="ATIVO",
        )
        self.db.add_all([self.aluno, self.co_reservante, self.professor, self.laboratorio])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_migracao_idempotente_preserva_dados_e_tabelas(self):
        reserva = models.Reserva(
            id="reserva-legada",
            laboratorio_id=self.laboratorio.id,
            usuario_id=self.aluno.id,
            data_inicio=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=1),
            data_fim=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=1, hours=1),
            finalidade="Reserva anterior",
            status="PENDENTE",
        )
        self.db.add(reserva)
        self.db.commit()

        aplicar_migracoes(self.engine)
        aplicar_migracoes(self.engine)

        tabelas = set(inspect(self.engine).get_table_names())
        self.assertTrue(
            {"favoritos_usuarios", "reserva_co_reservantes", "notificacoes_grupo"} <= tabelas
        )
        self.assertIsNotNone(
            self.db.query(models.Reserva).filter_by(id="reserva-legada").first()
        )

    def test_resumo_conta_faltas_na_janela_movel(self):
        agora = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.add_all(
            [
                models.Reserva(
                    laboratorio_id=self.laboratorio.id,
                    usuario_id=self.aluno.id,
                    data_inicio=agora - timedelta(days=10),
                    data_fim=agora - timedelta(days=10) + timedelta(hours=1),
                    finalidade="Falta recente",
                    status="NO_SHOW",
                    data_no_show=agora - timedelta(days=10),
                ),
                models.Reserva(
                    laboratorio_id=self.laboratorio.id,
                    usuario_id=self.aluno.id,
                    data_inicio=agora - timedelta(days=40),
                    data_fim=agora - timedelta(days=40) + timedelta(hours=1),
                    finalidade="Falta antiga",
                    status="NO_SHOW",
                    data_no_show=agora - timedelta(days=40),
                ),
            ]
        )
        self.db.commit()

        resumo = obter_resumo_aluno(self.aluno, self.db)

        self.assertEqual(resumo.faltas_no_periodo, 1)
        self.assertEqual(resumo.faltas_restantes, 2)

    def test_favorito_e_busca_restringem_dados_ao_aluno(self):
        favorito = adicionar_favorito(self.laboratorio.id, self.aluno, self.db)
        duplicado = adicionar_favorito(self.laboratorio.id, self.aluno, self.db)
        alunos = buscar_alunos("Bruno", self.aluno, self.db)

        self.assertEqual(favorito.id, self.laboratorio.id)
        self.assertEqual(duplicado.id, self.laboratorio.id)
        self.assertEqual([aluno.id for aluno in alunos], [self.co_reservante.id])
        self.assertEqual(len(listar_favoritos(self.aluno, self.db)), 1)

        remover_favorito(self.laboratorio.id, self.aluno, self.db)
        self.assertEqual(listar_favoritos(self.aluno, self.db), [])

    def test_professor_pode_manter_favoritos_isolados(self):
        adicionar_favorito(self.laboratorio.id, self.aluno, self.db)

        favorito = adicionar_favorito(self.laboratorio.id, self.professor, self.db)

        self.assertEqual(favorito.id, self.laboratorio.id)
        self.assertEqual(
            [item.id for item in listar_favoritos(self.professor, self.db)],
            [self.laboratorio.id],
        )
        self.assertEqual(
            [item.id for item in listar_favoritos(self.aluno, self.db)],
            [self.laboratorio.id],
        )

        remover_favorito(self.laboratorio.id, self.professor, self.db)

        self.assertEqual(listar_favoritos(self.professor, self.db), [])
        self.assertEqual(len(listar_favoritos(self.aluno, self.db)), 1)

    def test_reserva_em_grupo_aparece_para_todos_e_preserva_checkin_do_titular(self):
        inicio = datetime.now(timezone.utc) + timedelta(days=1)
        reserva = solicitar_reserva(
            schemas.ReservaCriar(
                recurso_id=self.laboratorio.id,
                data_inicio=inicio,
                data_fim=inicio + timedelta(hours=1),
                finalidade="Estudo em grupo",
                co_reservante_ids=[self.co_reservante.id],
            ),
            self.aluno,
            self.db,
        )
        historico = listar_minhas_reservas(self.co_reservante, self.db)

        self.assertEqual(reserva.co_reservantes[0].id, self.co_reservante.id)
        self.assertEqual(len(historico), 1)
        self.assertEqual(historico[0].usuario_id, self.aluno.id)
        with self.assertRaises(HTTPException) as erro:
            fazer_checkin(reserva.id, self.co_reservante, self.db)
        self.assertEqual(erro.exception.status_code, 404)

    def test_grade_semanal_considera_reservas_aprovadas(self):
        agora = datetime.now(timezone.utc).replace(tzinfo=None)
        inicio = agora + timedelta(days=1)
        reserva = models.Reserva(
            laboratorio_id=self.laboratorio.id,
            usuario_id=self.aluno.id,
            data_inicio=inicio,
            data_fim=inicio + timedelta(hours=2),
            finalidade="Estudo",
            status="APROVADA",
        )
        self.db.add(reserva)
        self.db.commit()

        grade = consultar_grade_semanal(
            self.laboratorio.id,
            (agora - timedelta(days=agora.weekday())).replace(tzinfo=timezone.utc),
            self.db,
        )

        self.assertEqual(len(grade.blocos_ocupados), 1)
        self.assertGreaterEqual(len(grade.blocos_livres), 1)

    def test_lembretes_de_grupo_sao_enviados_sem_duplicacao(self):
        agora = datetime.now(timezone.utc).replace(tzinfo=None)
        reserva = models.Reserva(
            laboratorio_id=self.laboratorio.id,
            usuario_id=self.aluno.id,
            data_inicio=agora + timedelta(minutes=20),
            data_fim=agora + timedelta(minutes=80),
            finalidade="Estudo em grupo",
            status="APROVADA",
        )
        reserva.co_reservantes.append(
            models.ReservaCoReservante(usuario_id=self.co_reservante.id)
        )
        self.db.add(reserva)
        self.db.commit()

        self.assertEqual(gerar_lembretes_checkin(self.db, agora), 2)
        self.assertEqual(gerar_lembretes_checkin(self.db, agora), 0)
        self.assertEqual(self.db.query(models.Notificacao).count(), 1)
        self.assertEqual(self.db.query(models.NotificacaoGrupo).count(), 1)

    def test_decisao_e_leitura_de_notificacao_de_grupo(self):
        inicio = datetime.now(timezone.utc) + timedelta(days=1)
        reserva_criada = solicitar_reserva(
            schemas.ReservaCriar(
                recurso_id=self.laboratorio.id,
                data_inicio=inicio,
                data_fim=inicio + timedelta(hours=1),
                finalidade="Atividade em grupo",
                co_reservante_ids=[self.co_reservante.id],
            ),
            self.aluno,
            self.db,
        )

        analisar_reserva(
            reserva_criada.id,
            schemas.ReservaAnaliseAtualizar(status="APROVADA"),
            self.professor,
            self.db,
        )
        notificacoes = listar_notificacoes(self.co_reservante, self.db)

        self.assertEqual(notificacoes.nao_lidas, 1)
        self.assertEqual(len(notificacoes.notificacoes), 1)
        self.assertEqual(notificacoes.notificacoes[0].tipo, "RESERVA_APROVADA")
        lida = marcar_como_lida(
            notificacoes.notificacoes[0].id,
            self.co_reservante,
            self.db,
        )
        self.assertTrue(lida.lida)
        self.assertEqual(listar_notificacoes(self.aluno, self.db).nao_lidas, 1)


if __name__ == "__main__":
    unittest.main()
