# SPEC-002: Gestão de Usuários

**Status:** Concluído
**Objetivo:** Permitir que o Administrador consulte, cadastre e altere o status de acesso de utilizadores no sistema Acessum.
**Atores:** Administrador (Exclusivo)

## 1. Regras de Negócio e Segurança
* **Controlo de Acesso (RBAC):** Apenas o perfil `ADMINISTRADOR` tem autorização para aceder aos endpoints de escrita e leitura e à interface de gestão.
* **Autenticação:** O sistema utiliza `HTTPBearer` (Token JWT via JSON), sem dependência de formulários padrão OAuth2.
* **Soft Delete:** A exclusão de utilizadores é lógica. O status transita entre `ATIVO` e `INATIVO` para preservar a integridade do histórico do banco de dados.

## 2. Especificação da API (`/api/usuarios/`)
* `GET /`: Lista todos os utilizadores (Protegido: Admin).
* `POST /`: Cria um novo utilizador exigindo Nome, Email, Senha e Perfil (ALUNO, PROFESSOR, ADMINISTRADOR) (Protegido: Admin).
* `PATCH /{id}/status`: Alterna o status do utilizador (ATIVO ↔ INATIVO) (Protegido: Admin).

## 3. Especificação de Interface (React)
* **Componente:** `GestaoUsuarios.jsx`
* **Formulário:** Captura de dados para criação de novos acessos.
* **Tabela:** Renderização condicional de cores baseada no status (Verde = ATIVO, Vermelho = INATIVO).