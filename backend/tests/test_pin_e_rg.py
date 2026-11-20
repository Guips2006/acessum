import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
import schemas
from auth_utils import create_token, get_password_hash, verify_password
from database import Base, get_db
from migrations import aplicar_migracoes
from routers import auth, perfil, usuarios


class TestePinEValidacaoRg(unittest.TestCase):
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
        self.app.include_router(perfil.router)
        self.app.include_router(usuarios.router)

        def obter_banco_teste():
            with self.SessionLocal() as db:
                yield db

        self.app.dependency_overrides[get_db] = obter_banco_teste
        with self.SessionLocal() as db:
            usuario = models.Usuario(
                id="usuario-teste",
                nome="Administrador de Teste",
                email="admin@teste.com",
                senha_hash=get_password_hash("SenhaSegura1234"),
                perfil="ADMINISTRADOR",
                status="ATIVO",
            )
            db.add(usuario)
            db.commit()
        self.token = create_token("usuario-teste", "ADMINISTRADOR")
        self.client = TestClient(self.app)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def test_usuario_sem_pin_e_bloqueado_e_sessao_indica_pin_pendente(self):
        login = self.client.post(
            "/api/auth/login",
            json={"email": "admin@teste.com", "senha": "SenhaSegura1234"},
        )
        self.assertEqual(login.status_code, 200)
        self.assertFalse(login.json()["pin_definido"])

        resposta = self.client.get("/api/usuarios/", headers=self.headers)
        self.assertEqual(resposta.status_code, 403)
        self.assertEqual(
            resposta.json()["detail"],
            "É obrigatório cadastrar o PIN de segurança antes de acessar o sistema.",
        )

        sessao = self.client.get("/api/auth/me", headers=self.headers)
        self.assertEqual(sessao.status_code, 200)
        self.assertFalse(sessao.json()["pin_definido"])

    def test_pin_invalido_e_rejeitado_e_pin_valido_libera_acesso(self):
        pins_invalidos = [
            {"pin": "12345", "confirmar_pin": "12345"},
            {"pin": "12a456", "confirmar_pin": "12a456"},
            {"pin": "123456", "confirmar_pin": "654321"},
        ]
        for dados in pins_invalidos:
            with self.subTest(dados=dados):
                resposta = self.client.put(
                    "/api/perfil/pin",
                    headers=self.headers,
                    json=dados,
                )
                self.assertEqual(resposta.status_code, 422)

        resposta = self.client.put(
            "/api/perfil/pin",
            headers=self.headers,
            json={"pin": "012345", "confirmar_pin": "012345"},
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertTrue(resposta.json()["pin_definido"])

        with self.SessionLocal() as db:
            usuario = db.get(models.Usuario, "usuario-teste")
            self.assertTrue(verify_password("012345", usuario.pin_hash))
            self.assertNotEqual(usuario.pin_hash, "012345")

        acesso = self.client.get("/api/usuarios/", headers=self.headers)
        self.assertEqual(acesso.status_code, 200)

    def test_rg_invalido_e_rejeitado_no_schema_e_endpoint(self):
        dados_validos = {
            "nome": "Pessoa Teste",
            "email": "pessoa@teste.com",
            "perfil": "ALUNO",
            "cpf": "529.982.247-25",
            "rg": "00.000.000-X",
            "data_nascimento": "2000-01-01",
            "senha": "SenhaForte1234",
        }
        usuario = schemas.UsuarioCriar.model_validate(dados_validos)
        self.assertEqual(usuario.rg, "00000000X")

        for rg in ("1234567890", "00.000.000-00", "12/345/678-X"):
            with self.subTest(rg=rg):
                with self.assertRaises(ValueError):
                    schemas.UsuarioCriar.model_validate({**dados_validos, "rg": rg})

        self.client.put(
            "/api/perfil/pin",
            headers=self.headers,
            json={"pin": "012345", "confirmar_pin": "012345"},
        )
        for rg in ("1234567890", "00.000.000-00"):
            with self.subTest(rg_endpoint=rg):
                resposta = self.client.post(
                    "/api/usuarios/",
                    headers=self.headers,
                    json={**dados_validos, "rg": rg},
                )
                self.assertEqual(resposta.status_code, 422)


class TesteMigracaoPinAditiva(unittest.TestCase):
    def test_migracao_adiciona_pin_hash_sem_alterar_usuario_existente(self):
        engine = create_engine("sqlite://")
        with engine.begin() as conexao:
            conexao.exec_driver_sql(
                "CREATE TABLE usuarios ("
                "id VARCHAR(36) PRIMARY KEY, nome VARCHAR(100), email VARCHAR(100), "
                "senha_hash VARCHAR(255), perfil VARCHAR(20), status VARCHAR(20), "
                "avatar_url VARCHAR(500), ultima_atividade DATETIME, "
                "suspensao_ate DATETIME, cpf VARCHAR(11), rg VARCHAR(30), "
                "data_nascimento DATE, deve_trocar_senha BOOLEAN NOT NULL DEFAULT 0)"
            )
            conexao.exec_driver_sql(
                "INSERT INTO usuarios (id, nome, email, senha_hash, perfil, status) "
                "VALUES ('usuario-legado', 'Conta existente', 'legado@teste.com', "
                "'hash-existente', 'ALUNO', 'ATIVO')"
            )

        aplicar_migracoes(engine)
        colunas = {coluna["name"] for coluna in inspect(engine).get_columns("usuarios")}
        self.assertIn("pin_hash", colunas)
        with engine.connect() as conexao:
            usuario = conexao.exec_driver_sql(
                "SELECT id, nome, email, senha_hash, pin_hash FROM usuarios"
            ).one()
        self.assertEqual(
            tuple(usuario),
            ("usuario-legado", "Conta existente", "legado@teste.com", "hash-existente", None),
        )
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
