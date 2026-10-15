# Registros de Decisão Arquitetural (ADRs) — Acessum

Este documento registra as principais decisões arquiteturais e escolhas de tecnologia (Tech Stack) para o projeto Acessum, resolvendo a pendência **OPEN-14** apontada no Mapa de Specs.

---

## ADR 001: Arquitetura de Repositório (Monorepo)
- **Status:** Aceito
- **Contexto:** Precisamos definir como o código do frontend, do backend e a documentação (Specs) coexistirão, visando simplificar o rastreamento de features completas (ex: ao fechar a SPEC-001, ter o código de back e front no mesmo Pull Request).
- **Decisão:** Utilizar a abordagem de **Monorepo**. O repositório único abrigará as pastas `/backend`, `/frontend` e `/docs`.
- **Consequências:**
  - **Positivas:** Facilita a manutenção, o code review (tudo na mesma PR) e a sincronia entre a documentação e o código.
  - **Negativas:** Exigirá configuração específica nos pipelines de CI/CD no futuro (para que uma alteração no backend não faça o *deploy* do frontend desnecessariamente).

## ADR 002: Stack do Backend (Python + FastAPI)
- **Status:** Aceito
- **Contexto:** O sistema exige respostas rápidas (RNF-01: tempo de resposta < 2s, P95) e o escopo aponta para a necessidade de documentação automática de endpoints (RNF-05: OpenAPI/Swagger).
- **Decisão:** A API será desenvolvida em **Python** utilizando o framework **FastAPI**.
- **Consequências:**
  - **Positivas:** Altíssimo desempenho (similar a Node.js/Go), validação de dados nativa via Pydantic e geração automática e nativa da documentação Swagger (atendendo diretamente o RNF-05).
  - **Negativas:** Requer que o ambiente de produção suporte ASGI (ex: Uvicorn).

## ADR 003: Banco de Dados e ORM (SQLite + SQLAlchemy)
- **Status:** Aceito
- **Contexto:** O domínio do sistema (Usuários, Reservas, Equipamentos, Laboratórios) é relacional. Para otimizar a velocidade de desenvolvimento inicial e remover a complexidade de infraestrutura e drivers externos, optou-se por um banco embarcado.
- **Decisão:** O banco de dados escolhido é o **SQLite**. A comunicação do backend com o banco será feita através do ORM **SQLAlchemy**.
- **Consequências:**
  - **Positivas:** Zero configuração de servidor (o banco é um arquivo `.db` local), excelente para desenvolvimento rápido e testes. Como usamos o SQLAlchemy, a lógica de negócio fica blindada e o banco pode ser trocado futuramente alterando apenas a string de conexão.
  - **Negativas:** Não é ideal para alta concorrência de escrita. Se o sistema escalar para centenas de usuários simultâneos no futuro, exigirá migração para um banco cliente-servidor (PostgreSQL/SQL Server).

## ADR 004: Stack do Frontend (React + Vite)
- **Status:** Aceito
- **Contexto:** A interface web precisa ser dinâmica e garantir uma boa usabilidade para alunos e professores interagirem com mapas de horários e formulários (RNF-04).
- **Decisão:** O frontend será uma Single Page Application (SPA) desenvolvida em **React** com **JavaScript**, utilizando o **Vite** como *bundler*.
- **Consequências:**
  - **Positivas:** O Vite oferece um tempo de carregamento e compilação instantâneo no ambiente de desenvolvimento. O ecossistema React possui vasta gama de bibliotecas para calendários e tabelas.
  - **Negativas:** Requer gerenciamento de estado cuidadoso (Context API) para manter tokens de autenticação seguros no navegador.

## ADR 005: Estratégia de Autenticação (JWT)
- **Status:** Aceito
- **Contexto:** O sistema exige autenticação obrigatória (RNF-02) e perfis de acesso distintos (Aluno, Professor, Admin). A API REST (FastAPI) deve ser "stateless" (sem estado).
- **Decisão:** Autenticação baseada em tokens **JWT (JSON Web Tokens)**. O payload do token conterá o ID do usuário e o seu `Perfil`, e terá validade de 24 horas. Senhas serão armazenadas usando hash `bcrypt` (RNF-03).
- **Consequências:**
  - **Positivas:** Escalabilidade (o backend não precisa guardar sessão em memória). O frontend pode facilmente decodificar o token para descobrir se o usuário é Aluno ou Admin e ajustar a interface.
  - **Negativas:** Tokens JWT não podem ser invalidados individualmente antes da expiração de forma nativa (caso necessário no futuro, exigirá uma "blacklist" no banco de dados).
