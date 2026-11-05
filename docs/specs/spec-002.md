# SPEC-002: Gestão de Usuários

**Status:** CONCLUÍDO
**Objetivo:** Permitir que o Administrador consulte, cadastre e altere o status de acesso dos usuários no Acessum.
**Atores:** Administrador (Exclusivo)

## 1. Regras de Negócio e Segurança
* **Controle de acesso (RBAC):** somente o perfil `ADMINISTRADOR` pode acessar os endpoints e a interface de gestão.
* **Autenticação:** O sistema utiliza `HTTPBearer` (Token JWT via JSON), sem dependência de formulários padrão OAuth2.
* **Exclusão lógica:** a desativação alterna entre `ATIVO` e `INATIVO`, preservando o histórico. Novos cadastros exigem nome, e-mail, CPF, RG, data de nascimento e senha; CPF é único quando informado.

## 2. Especificação da API (`/api/usuarios/`)
* `GET /`: lista todos os usuários (protegido: Administrador).
* `POST /`: cria usuário por meio do contrato `UsuarioCriar` e retorna `UsuarioResponse` (somente Administrador).
* `PATCH /{usuario_id}/status`: alterna o status para `ATIVO` ou `INATIVO` e retorna `UsuarioStatusResponse` (somente Administrador).

## 3. Especificação de Interface (React)
* **Componente:** `GestaoUsuarios.jsx`, integrado em `App.jsx`.
* **Formulário:** Captura de dados para criação de novos acessos.
* **Tabela:** Renderização condicional de cores baseada no status (Verde = ATIVO, Vermelho = INATIVO).

**Contratos:** `UsuarioCriar`, `UsuarioResponse` e `UsuarioStatusResponse`, definidos em `backend/schemas.py`.