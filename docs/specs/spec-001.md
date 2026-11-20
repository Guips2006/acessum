# SPEC-001: Autenticação e Controle de Acesso (RBAC)

## 1. Visão Geral
**Status:** 🟢 Concluída
**Objetivo:** Garantir que apenas usuários autenticados acessem o sistema Acessum, protegendo as rotas da API e renderizando interfaces no Frontend de acordo com o perfil de acesso do usuário (Role-Based Access Control).

## 2. Requisitos Atendidos
- **UC-01:** Fazer Login (Fluxo unificado para todos os perfis).
- **RNF-02:** O sistema deve exigir autenticação para todas as operações sensíveis.
- **RNF-03:** As senhas devem ser armazenadas com hash seguro no banco de dados.

## 3. Decisões Técnicas e Arquitetura
- **Banco de Dados:** SQLite (via SQLAlchemy ORM). Escolhido pela agilidade no desenvolvimento local sem necessidade de infraestrutura pesada (conforme ADR-003 atualizada).
- **Criptografia de Senha:** `bcrypt` (via biblioteca `passlib`). As senhas trafegam em texto puro apenas no momento do login e são validadas contra o hash armazenado.
- **Gerenciamento de Estado (Frontend):** Implementado utilizando a Context API do React (`AuthContext`). Após o login, o token é armazenado no `localStorage` e enviado no cabeçalho `Authorization: Bearer <token>` nas requisições protegidas via Axios.

## 4. Estrutura de Dados (Model `Usuario`)
A tabela `usuarios` foi criada com os seguintes atributos principais:
- `id`: Chave primária gerada via UUID (String 36).
- `nome`: String.
- `email`: String (Único e indexado para otimizar as buscas no login).
- `senha_hash`: String gerada pelo bcrypt.
- `perfil`: String limitando as permissões (ADMINISTRADOR, PROFESSOR, ALUNO).
- `status`: String (ATIVO, INATIVO). Usuários inativos têm o login bloqueado na API.

## 5. Fluxo de Autorização e Regras de Negócio
### Backend (Leão de Chácara VIP)
Foi criada uma dependência no FastAPI chamada `exigir_perfil(["PERFIL_1", "PERFIL_2"])`. 
Essa função intercepta a requisição antes de atingir o banco de dados:
1. Verifica se o token JWT existe e é válido.
2. Decodifica o token para descobrir o perfil do usuário.
3. Se o perfil não estiver na lista de permitidos para aquela rota, a API bloqueia a requisição imediatamente com um erro `403 Forbidden`.

### Frontend (Renderização Condicional)
A interface consome os dados do `AuthContext` e utiliza operadores lógicos simples para exibir ou ocultar funcionalidades:
- **Administrador:** Vê menus de Gestão de Usuários e Cadastro de Laboratórios.
- **Professor:** Vê menus de Solicitação de Reserva e Aprovação de Reservas Pendentes.
- **Aluno:** Vê apenas menus de Consulta de Laboratórios e Solicitação de Reserva.

## 6. Endpoints Desenvolvidos
- `POST /api/auth/login`: Recebe `{email, senha}`, valida as credenciais e retorna `token`, `nome`, `email` e `perfil`. Retorna `401` para credenciais inválidas ou conta inativa.
- `GET /api/auth/me`: Retorna `id`, `nome`, `email` e `perfil` do usuário autenticado.

O Swagger (`/docs`) e a especificação OpenAPI podem ser acessados sem autenticação; a proteção é aplicada às operações da API. Para testar uma operação protegida pelo Swagger:
1. Envie credenciais válidas para `POST /api/auth/login`.
2. Copie o valor de `token` da resposta e informe-o em **Authorize**.
3. Execute a operação desejada. Por exemplo, `GET /api/usuarios/` exige um token de perfil `ADMINISTRADOR`.

Os exemplos de requisição são ilustrativos e não representam contas válidas. A antiga rota `GET /setup` foi removida por criar credenciais padrão e poder apagar contas.

### Acesso de desenvolvimento
As senhas são armazenadas como hashes e não podem ser recuperadas. Para redefinir localmente a senha de um administrador ativo, execute `python redefinir_senha_admin_dev.py` a partir de `backend/`; a senha é solicitada sem eco, portanto os caracteres não aparecem enquanto são digitados. A senha não é gravada em documentação nem no código-fonte. A redefinição é uma operação de desenvolvimento que requer acesso direto ao banco local.