import unittest
from datetime import date

from pydantic import ValidationError

import schemas


class UsuarioCriarSchemaTests(unittest.TestCase):
    def dados_validos(self):
        return {
            "nome": "  Pessoa Usuária  ",
            "email": " PESSOA@EXAMPLE.COM ",
            "cpf": "529.982.247-25",
            "rg": "12.345.678-x",
            "data_nascimento": "17/05/1990",
            "senha": "SenhaForte123!",
            "perfil": "ALUNO",
        }

    def test_aceita_mascaras_e_normaliza_dados_para_persistencia(self):
        usuario = schemas.UsuarioCriar(**self.dados_validos())

        self.assertEqual(usuario.nome, "Pessoa Usuária")
        self.assertEqual(usuario.email, "pessoa@example.com")
        self.assertEqual(usuario.cpf, "52998224725")
        self.assertEqual(usuario.rg, "12345678X")
        self.assertEqual(usuario.data_nascimento, date(1990, 5, 17))
        self.assertEqual(usuario.perfil, "ALUNO")

    def test_aceita_payload_normalizado_e_data_iso(self):
        dados = self.dados_validos()
        dados.update({
            "cpf": "52998224725",
            "rg": "123456789",
            "data_nascimento": "1990-05-17",
        })

        usuario = schemas.UsuarioCriar(**dados)

        self.assertEqual(usuario.cpf, "52998224725")
        self.assertEqual(usuario.rg, "123456789")
        self.assertEqual(usuario.data_nascimento, date(1990, 5, 17))

    def test_rejeita_perfil_data_e_senha_invalidos(self):
        for campo, valor in (
            ("perfil", "aluno"),
            ("data_nascimento", "31/02/1990"),
            ("senha", "senhaforte123"),
            ("senha", "SENHAFORTE123!"),
            ("senha", "SenhaForte!!!"),
            ("senha", "SenhaForte123"),
            ("senha", "Forte123!"),
        ):
            dados = self.dados_validos()
            dados[campo] = valor
            with self.subTest(campo=campo, valor=valor), self.assertRaises(ValidationError):
                schemas.UsuarioCriar(**dados)


if __name__ == "__main__":
    unittest.main()
