import hashlib
import unittest
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from auth_utils import get_password_hash, verify_password
from database import Base, get_db
from migrations import aplicar_migracoes
from routers import auth


class TesteResetSenha(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.SessionLocal = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.app = FastAPI()
        self.app.include_router(auth.router)

        def obter_banco_teste():
            with self.SessionLocal() as db:
                yield db

        self.app.dependency_overrides[get_db] = obter_banco_teste
        self.client = TestClient(self.app)
        with self.SessionLocal() as db:
            db.add(
                models.Usuario(
                    id="usuario-reset-teste",
                    nome="Pessoa de Teste",
                    email="pessoa@teste.com",
                    senha_hash=get_password_hash("SenhaAntiga123!"),
                    pin_hash=get_password_hash("012345"),
                    perfil="ALUNO",
                    status="ATIVO",
                    cpf="52998224725",
                    rg="12345678X",
                    deve_trocar_senha=True,
                )
            )
            db.commit()
        self.dados_corretos = {
            "email": "PESSOA@TESTE.COM",
            "cpf": "529.982.247-25",
            "rg": "12.345.678-X",
            "pin": "012345",
        }

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def validar_dados(self, dados=None):
        return self.client.post(
            "/api/auth/validar-dados-reset",
            json=dados or self.dados_corretos,
        )

    def redefinir(self, token, senha="SenhaNova123!"):
        return self.client.post(
            "/api/auth/redefinir-senha",
            json={
                "token": token,
                "nova_senha": senha,
                "confirmar_senha": senha,
            },
        )

    def test_fluxo_completo_valida_quatro_fatores_e_redefine_senha(self):
        validacao = self.validar_dados()
        self.assertEqual(validacao.status_code, 200)
        token = validacao.json()["token"]

        with self.SessionLocal() as db:
            registro = db.query(models.TokenResetSenha).one()
            self.assertNotEqual(registro.token_hash, token)
            self.assertEqual(
                registro.token_hash,
                hashlib.sha256(token.encode("utf-8")).hexdigest(),
            )
            self.assertLessEqual(
                registro.expira_em - datetime.now(timezone.utc).replace(tzinfo=None),
                timedelta(minutes=10),
            )

        resposta = self.redefinir(token)
        self.assertEqual(resposta.status_code, 200)
        with self.SessionLocal() as db:
            usuario = db.get(models.Usuario, "usuario-reset-teste")
            token_usado = db.query(models.TokenResetSenha).one()
            log = db.query(models.LogAuditoria).one()
            self.assertTrue(verify_password("SenhaNova123!", usuario.senha_hash))
            self.assertFalse(usuario.deve_trocar_senha)
            self.assertIsNotNone(token_usado.usado_em)
            self.assertNotIn(token, log.descricao)
            self.assertNotIn("012345", log.descricao)

    def test_fatores_incorretos_retorna_mensagem_generica(self):
        casos = (
            {**self.dados_corretos, "email": "outra@teste.com"},
            {**self.dados_corretos, "cpf": "111.111.111-11"},
            {**self.dados_corretos, "rg": "98.765.432-X"},
            {**self.dados_corretos, "pin": "999999"},
        )
        mensagens = []
        for dados in casos:
            with self.subTest(dados=dados):
                resposta = self.validar_dados(dados)
                self.assertEqual(resposta.status_code, 400)
                mensagens.append(resposta.json()["detail"])
        self.assertEqual(len(set(mensagens)), 1)
        self.assertNotIn("CPF", mensagens[0])
        self.assertNotIn("RG", mensagens[0])
        self.assertNotIn("PIN", mensagens[0])
        self.assertNotIn("e-mail", mensagens[0])

    def test_bloqueia_apos_tentativas_invalidas_consecutivas(self):
        dados_invalidos = {**self.dados_corretos, "pin": "999999"}
        for _ in range(5):
            self.assertEqual(self.validar_dados(dados_invalidos).status_code, 400)
        bloqueada = self.validar_dados()
        self.assertEqual(bloqueada.status_code, 429)

    def test_token_usado_nao_pode_ser_reutilizado(self):
        token = self.validar_dados().json()["token"]
        self.assertEqual(self.redefinir(token).status_code, 200)
        repeticao = self.redefinir(token)
        self.assertEqual(repeticao.status_code, 400)

    def test_token_expirado_e_rejeitado(self):
        token = self.validar_dados().json()["token"]
        with self.SessionLocal() as db:
            registro = db.query(models.TokenResetSenha).one()
            registro.expira_em = (
                datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=11)
            )
            db.commit()
        resposta = self.redefinir(token)
        self.assertEqual(resposta.status_code, 400)

    def test_senha_sem_requisitos_de_complexidade_e_rejeitada(self):
        token = self.validar_dados().json()["token"]
        senhas_invalidas = (
            "Ab1!",
            "senha123!",
            "SENHA123!",
            "SenhaNova!",
            "SenhaNova123",
        )
        for senha in senhas_invalidas:
            with self.subTest(senha=senha):
                self.assertEqual(self.redefinir(token, senha).status_code, 422)

        divergente = self.client.post(
            "/api/auth/redefinir-senha",
            json={
                "token": token,
                "nova_senha": "SenhaNova123!",
                "confirmar_senha": "SenhaDiferente123!",
            },
        )
        self.assertEqual(divergente.status_code, 422)


class TesteMigracaoResetSenha(unittest.TestCase):
    def test_migracao_aditiva_preserva_usuario_e_cria_tabelas_reset(self):
        engine = create_engine("sqlite://")
        with engine.begin() as conexao:
            conexao.exec_driver_sql(
                "CREATE TABLE usuarios ("
                "id VARCHAR(36) PRIMARY KEY, nome VARCHAR(100), email VARCHAR(100), "
                "senha_hash VARCHAR(255), perfil VARCHAR(20), status VARCHAR(20))"
            )
            conexao.exec_driver_sql(
                "INSERT INTO usuarios (id, nome, email, senha_hash, perfil, status) "
                "VALUES ('usuario-legado', 'Conta existente', 'legado@teste.com', "
                "'hash-existente', 'ALUNO', 'ATIVO')"
            )

        aplicar_migracoes(engine)

        inspetor = inspect(engine)
        tabelas = set(inspetor.get_table_names())
        colunas_usuario = {
            coluna["name"] for coluna in inspetor.get_columns("usuarios")
        }
        self.assertIn("cpf", colunas_usuario)
        self.assertIn("rg", colunas_usuario)
        self.assertIn("pin_hash", colunas_usuario)
        self.assertIn("tokens_reset_senha", tabelas)
        self.assertIn("tentativas_reset_senha", tabelas)
        with engine.connect() as conexao:
            usuario = conexao.exec_driver_sql(
                "SELECT id, nome, senha_hash FROM usuarios"
            ).one()
        self.assertEqual(
            tuple(usuario),
            ("usuario-legado", "Conta existente", "hash-existente"),
        )
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
