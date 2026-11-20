from __future__ import annotations

import argparse
from getpass import getpass
from pathlib import Path

from sqlalchemy import func

import models
from auth_utils import get_password_hash
from database import SessionLocal


def main() -> None:
    if Path.cwd().resolve() != Path(__file__).parent.resolve():
        raise SystemExit("Execute este script a partir da pasta backend.")

    parser = argparse.ArgumentParser(
        description="Redefine interativamente a senha de uma conta administradora de desenvolvimento."
    )
    parser.add_argument(
        "--email",
        default="guilherme@acessum.com",
        help="E-mail da conta administradora ativa (padrão: guilherme@acessum.com).",
    )
    args = parser.parse_args()
    email = args.email.strip().lower()

    with SessionLocal() as db:
        usuario = (
            db.query(models.Usuario)
            .filter(func.lower(models.Usuario.email) == email)
            .one_or_none()
        )
        if usuario is None:
            raise SystemExit(f"Conta não encontrada: {email}")
        if usuario.perfil != "ADMINISTRADOR" or usuario.status != "ATIVO":
            raise SystemExit("A conta informada não é um administrador ativo.")

        senha = getpass("Nova senha (a digitação não aparece): ")
        confirmacao = getpass("Confirme a senha (a digitação não aparece): ")
        if senha != confirmacao:
            raise SystemExit("As senhas não coincidem.")
        if not senha.strip():
            raise SystemExit("A senha não pode estar vazia.")
        if len(senha.encode("utf-8")) > 72:
            raise SystemExit("A senha não pode exceder 72 bytes.")

        usuario.senha_hash = get_password_hash(senha)
        db.commit()

    print(f"Senha redefinida para {email}.")


if __name__ == "__main__":
    main()
