import hashlib
import unittest
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response
from pydantic import ValidationError
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

import models
import schemas
from auth_utils import get_password_hash, verify_password
from migrations import aplicar_migracoes
from routers.perfil import alterar_pin, serializar_perfil
from routers.auth import (
    DadosLogin,
    login as autenticar_usuario,
    redefinir_senha_com_token,
    validar_dados_reset,
)


class ResetSenhaTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        aplicar_migracoes(self.engine)
        models.Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.usuario = models.Usuario(
            id="usuario-reset",
            nome="Pessoa Usuária",
            email="pessoa@example.com",
            cpf="52998224725",
            pin_hash=get_password_hash("012345"),
            rg="1234567",
            data_nascimento=date(1990, 5, 17),
            senha_hash="hash-anterior",
            perfil="ALUNO",
            status="ATIVO",
        )
        self.db.add(self.usuario)
        self.db.commit()
        self.request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/api/auth/validar-dados-reset",
                "headers": [],
                "client": ("192.0.2.10", 12345),
            }
        )
        self.response = Response()
        self.dados_validos = schemas.ValidarDadosResetRequest(
            email=" PESSOA@example.com ",
            cpf="529.982.247-25",
            rg="12.345-67",
            pin="012345",
        )

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_migracao_de_reset_e_idempotente(self):
        aplicar_migracoes(self.engine)

        tabelas = set(inspect(self.engine).get_table_names())
        self.assertIn("tokens_reset_senha", tabelas)
        self.assertIn("tentativas_reset_senha", tabelas)
        self.assertEqual(self.db.query(models.Usuario).count(), 1)

    def test_login_retorna_status_do_pin_definido(self):
        self.usuario.senha_hash = get_password_hash("SenhaForte1!")
        self.db.commit()

        resposta = autenticar_usuario(
            DadosLogin(email="pessoa@example.com", senha="SenhaForte1!"),
            self.db,
        )
        resposta_validada = schemas.LoginResponse(**resposta)

        self.assertTrue(resposta_validada.pin_definido)
        self.assertTrue(resposta_validada.pin_configurado)

    def test_valida_dados_normalizados_e_emite_token_opaco(self):
        resposta = validar_dados_reset(
            self.dados_validos, self.request, self.response, self.db
        )

        registro = self.db.query(models.TokenResetSenha).one()
        self.assertEqual(len(resposta["token"]), 43)
        self.assertEqual(
            registro.token_hash,
            hashlib.sha256(resposta["token"].encode("utf-8")).hexdigest(),
        )
        self.assertNotEqual(registro.token_hash, resposta["token"])
        self.assertIsNone(registro.consumido_em)
        self.assertEqual(self.response.headers["Cache-Control"], "no-store")

    def test_nao_valida_dados_incorretos_ou_conta_inativa(self):
        dados_incorretos = schemas.ValidarDadosResetRequest(
            email="pessoa@example.com",
            cpf="529.982.247-25",
            rg="1234567",
            pin="012346",
        )
        with self.assertRaises(HTTPException) as erro:
            validar_dados_reset(
                dados_incorretos, self.request, self.response, self.db
            )
        self.assertEqual(erro.exception.status_code, 400)

        self.usuario.status = "INATIVO"
        self.db.commit()
        with self.assertRaises(HTTPException) as erro:
            validar_dados_reset(
                self.dados_validos, self.request, self.response, self.db
            )
        self.assertEqual(erro.exception.status_code, 400)

    def test_limita_tentativas_por_endereco(self):
        dados_incorretos = schemas.ValidarDadosResetRequest(
            email="pessoa@example.com",
            cpf="529.982.247-25",
            rg="1234567",
            pin="012346",
        )
        for _ in range(5):
            with self.assertRaises(HTTPException):
                validar_dados_reset(
                    dados_incorretos, self.request, self.response, self.db
                )

        with self.assertRaises(HTTPException) as erro:
            validar_dados_reset(
                self.dados_validos, self.request, self.response, self.db
            )
        self.assertEqual(erro.exception.status_code, 429)

    def test_nova_senha_atende_politica_no_backend(self):
        schemas.RedefinirSenhaRequest(token="t" * 43, nova_senha="SenhaForte1!")
        for senha in (
            "curta1!",
            "senhaforte1!",
            "SENHAFORTE1!",
            "SenhaForte!",
            "SenhaForte1",
            "SenhaForte1 ",
            "SenhaForte1!" + "á" * 36,
        ):
            with self.subTest(senha=senha), self.assertRaises(ValidationError):
                schemas.RedefinirSenhaRequest(token="t" * 43, nova_senha=senha)

    def test_redefine_com_hash_e_token_de_uso_unico(self):
        token = validar_dados_reset(
            self.dados_validos, self.request, self.response, self.db
        )["token"]
        dados = schemas.RedefinirSenhaRequest(token=token, nova_senha="SenhaForte1!")

        resposta = redefinir_senha_com_token(dados, self.db)

        self.assertEqual(resposta["mensagem"], "Senha redefinida com sucesso.")
        self.assertTrue(verify_password("SenhaForte1!", self.usuario.senha_hash))
        self.assertIsNotNone(self.db.query(models.TokenResetSenha).one().consumido_em)
        with self.assertRaises(HTTPException) as erro:
            redefinir_senha_com_token(dados, self.db)
        self.assertEqual(erro.exception.status_code, 400)

    def test_token_expirado_nao_redefine_senha(self):
        token = validar_dados_reset(
            self.dados_validos, self.request, self.response, self.db
        )["token"]
        registro = self.db.query(models.TokenResetSenha).one()
        registro.expira_em = datetime.now(timezone.utc).replace(
            tzinfo=None
        ) - timedelta(seconds=1)
        self.db.commit()

        with self.assertRaises(HTTPException) as erro:
            redefinir_senha_com_token(
                schemas.RedefinirSenhaRequest(token=token, nova_senha="SenhaForte1!"),
                self.db,
            )
        self.assertEqual(erro.exception.status_code, 400)
        self.assertEqual(self.usuario.senha_hash, "hash-anterior")

    def test_nova_validacao_invalida_token_anterior(self):
        token_anterior = validar_dados_reset(
            self.dados_validos, self.request, self.response, self.db
        )["token"]
        token_atual = validar_dados_reset(
            self.dados_validos, self.request, self.response, self.db
        )["token"]

        with self.assertRaises(HTTPException) as erro:
            redefinir_senha_com_token(
                schemas.RedefinirSenhaRequest(
                    token=token_anterior,
                    nova_senha="SenhaForte1!",
                ),
                self.db,
            )
        self.assertNotEqual(token_anterior, token_atual)
        self.assertEqual(erro.exception.status_code, 400)

    def test_reset_exige_pin_configurado_e_correspondente(self):
        self.usuario.pin_hash = None
        self.db.commit()
        with self.assertRaises(HTTPException) as erro:
            validar_dados_reset(
                self.dados_validos, self.request, self.response, self.db
            )
        self.assertEqual(erro.exception.status_code, 400)
        mensagem_sem_pin = erro.exception.detail

        self.usuario.pin_hash = get_password_hash("654321")
        self.db.commit()
        with self.assertRaises(HTTPException) as erro:
            validar_dados_reset(
                self.dados_validos, self.request, self.response, self.db
            )
        self.assertEqual(erro.exception.status_code, 400)
        self.assertEqual(erro.exception.detail, mensagem_sem_pin)

    def test_pin_schema_exige_seis_digitos_e_confirmacao(self):
        for pin in ("12345", "1234567", "12a456"):
            with self.subTest(pin=pin), self.assertRaises(ValidationError):
                schemas.AlterarPin(novo_pin=pin, confirmar_pin=pin)
        with self.assertRaises(ValidationError):
            schemas.AlterarPin(novo_pin="012345", confirmar_pin="012346")

    def test_rg_reset_normaliza_formato_e_restringe_digito_verificador(self):
        dados = schemas.ValidarDadosResetRequest(
            email="pessoa@example.com",
            cpf="529.982.247-25",
            rg="12.345.678-x",
            pin="012345",
        )
        self.assertEqual(dados.rg, "12345678X")

        for rg in ("12.345.678-XX", "12.345.678-A", "1234567890"):
            with self.subTest(rg=rg), self.assertRaises(ValidationError):
                schemas.ValidarDadosResetRequest(
                    email="pessoa@example.com",
                    cpf="529.982.247-25",
                    rg=rg,
                    pin="012345",
                )

    def test_reset_exige_rg_correspondente(self):
        dados_com_rg_incorreto = schemas.ValidarDadosResetRequest(
            email="pessoa@example.com",
            cpf="529.982.247-25",
            rg="1234568",
            pin="012345",
        )

        with self.assertRaises(HTTPException) as erro:
            validar_dados_reset(
                dados_com_rg_incorreto, self.request, self.response, self.db
            )
        self.assertEqual(erro.exception.status_code, 400)
        self.assertEqual(
            erro.exception.detail,
            "E-mail, CPF, RG ou PIN de segurança inválidos.",
        )

    def test_usuario_cadastra_e_altera_pin_com_hash_e_auditoria(self):
        self.usuario.pin_hash = None
        self.db.commit()
        resultado = alterar_pin(
            schemas.AlterarPin(novo_pin="001234", confirmar_pin="001234"),
            self.usuario,
            self.db,
        )
        self.assertEqual(
            resultado["mensagem"],
            "PIN de segurança atualizado com sucesso.",
        )
        self.assertTrue(verify_password("001234", self.usuario.pin_hash))
        self.assertNotEqual(self.usuario.pin_hash, "001234")
        self.assertTrue(serializar_perfil(self.usuario).pin_configurado)
        self.assertTrue(serializar_perfil(self.usuario).pin_definido)
        self.assertEqual(
            self.db.query(models.LogAuditoria).one().acao,
            "PIN_SEGURANCA_ATUALIZADO",
        )

        hash_anterior = self.usuario.pin_hash
        with self.assertRaises(HTTPException) as erro:
            alterar_pin(
                schemas.AlterarPin(
                    pin_atual="999999",
                    novo_pin="654321",
                    confirmar_pin="654321",
                ),
                self.usuario,
                self.db,
            )
        self.assertEqual(erro.exception.status_code, 400)
        self.assertEqual(self.usuario.pin_hash, hash_anterior)

        alterar_pin(
            schemas.AlterarPin(
                pin_atual="001234",
                novo_pin="654321",
                confirmar_pin="654321",
            ),
            self.usuario,
            self.db,
        )
        self.assertTrue(verify_password("654321", self.usuario.pin_hash))
        self.assertFalse(verify_password("001234", self.usuario.pin_hash))

    def test_perfil_indica_quando_pin_ainda_nao_foi_definido(self):
        self.usuario.pin_hash = None

        perfil = serializar_perfil(self.usuario)

        self.assertFalse(perfil.pin_configurado)
        self.assertFalse(perfil.pin_definido)

    def test_migracao_adiciona_hash_pin_sem_alterar_usuario_legado(self):
        engine = create_engine("sqlite://")
        try:
            with engine.begin() as conexao:
                conexao.exec_driver_sql(
                    "CREATE TABLE usuarios ("
                    "id VARCHAR(36) PRIMARY KEY, nome VARCHAR(100), "
                    "email VARCHAR(100), senha_hash VARCHAR(255), "
                    "perfil VARCHAR(20), status VARCHAR(20), "
                    "avatar_url VARCHAR(500), ultima_atividade DATETIME, "
                    "suspensao_ate DATETIME, cpf VARCHAR(11), rg VARCHAR(30), "
                    "data_nascimento DATE, "
                    "deve_trocar_senha BOOLEAN NOT NULL DEFAULT 0)"
                )
                conexao.exec_driver_sql(
                    "INSERT INTO usuarios (id, nome, email, cpf) "
                    "VALUES ('legado', 'Pessoa Legada', 'legado@example.com', "
                    "'52998224725')"
                )

            aplicar_migracoes(engine)
            aplicar_migracoes(engine)
            colunas = {coluna["name"] for coluna in inspect(engine).get_columns("usuarios")}
            self.assertIn("pin_hash", colunas)
            with engine.connect() as conexao:
                usuario = conexao.exec_driver_sql(
                    "SELECT nome, cpf, pin_hash FROM usuarios WHERE id = 'legado'"
                ).one()
            self.assertEqual(usuario.nome, "Pessoa Legada")
            self.assertEqual(usuario.cpf, "52998224725")
            self.assertIsNone(usuario.pin_hash)
        finally:
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
