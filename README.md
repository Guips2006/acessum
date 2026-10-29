cd frontend# Acessum

Sistema de gestão de acesso e utilização de laboratórios. O Acessum centraliza o cadastro de utilizadores, laboratórios e equipamentos, a consulta de disponibilidade, o fluxo de reservas e o relato de problemas.

## Arquitetura

- **Backend:** Python, FastAPI e SQLAlchemy.
- **Base de dados:** SQLite, criada e atualizada pela aplicação em `backend/acessum.db`.
- **Frontend:** React com Vite.
- **Autenticação:** JWT Bearer, com permissões por perfil.
- **Perfis:** Aluno, Professor e Administrador.

O frontend comunica com a API através do contexto de autenticação. O endereço da API pode ser configurado com a variável `VITE_API_BASE_URL`.

## Funcionalidades

- **Autenticação e permissões (SPEC-001):** início de sessão com JWT e controlo de acesso por perfil.
- **Gestão de utilizadores (SPEC-002):** cadastro, listagem, ativação e inativação de contas.
- **Gestão de laboratórios e equipamentos (SPEC-003 e SPEC-004):** cadastro, consulta e atualização de estado para os perfis autorizados.
- **Consulta de recursos (SPEC-005):** visualização de laboratórios e respetivos equipamentos.
- **Disponibilidade (SPEC-006):** consulta de períodos livres e ocupados; reservas pendentes não bloqueiam a agenda.
- **Solicitação de reservas (SPEC-007):** pedidos de reserva de laboratório com finalidade, associados ao utilizador autenticado.
- **Aprovação e recusa (SPEC-008):** análise de pedidos pendentes por Professores, com verificação de conflitos e motivo de recusa opcional.
- **Histórico (SPEC-012):** consulta das próprias reservas por Alunos e Professores.
- **Cancelamento (SPEC-009):** cancelamento de reservas pendentes ou aprovadas até uma hora antes do início.
- **Check-in e no-show (SPEC-010):** check-in entre 15 minutos antes e 15 minutos depois do início; reservas sem check-in após essa janela passam a `NO_SHOW`.
- **Encerramento (SPEC-011):** conclusão da utilização em curso e registo da hora efetiva de encerramento.
- **Relato de problemas (SPEC-013):** registo de problemas em laboratórios ou equipamentos e gestão dos estados `ABERTO` e `RESOLVIDO`.
- **Perfil, avatar e atividade (SPEC-015):** edição do próprio perfil, envio de avatar PNG/JPEG e registro da última atividade autenticada.
- **Penalidades de no-show (SPEC-016):** três faltas em 30 dias suspendem o Aluno por sete dias e bloqueiam novas reservas durante o período.
- **Dashboard administrativo (SPEC-017):** métricas de ocupação, reservas por status e evolução de não comparecimentos com filtros de período.
- **Relatórios (SPEC-018):** exportação de reservas filtradas em CSV e PDF no dashboard administrativo e no histórico pessoal.
- **Notificações (SPEC-019):** avisos de aprovação/recusa e lembretes de check-in em até 30 minutos, com leitura pelo sino na barra superior.
- **Auditoria (SPEC-020):** registro e consulta administrativa de ações críticas sobre usuários, laboratórios, reservas e perfis.
- **Refinamentos V2.1 (SPEC-021 a SPEC-024):** navegação revisada, cadastro com CPF/RG/nascimento, redefinição assistida de senha e bloqueio de datas passadas.

No MVP, as reservas são feitas ao nível do laboratório. Os equipamentos são consultados como recursos associados ao laboratório, mas não são reservados independentemente.

## Equipa

Projeto desenvolvido na disciplina de **Modelagem de Sistemas** da Universidade Presbiteriana Mackenzie.

- Arthur dos Reis
- Guilherme Pereira Soares
- Rebeca Carolina

## Requisitos

- Python 3.10 ou superior.
- Node.js e npm.
- Git.

## Executar localmente

Abra dois terminais na raiz do repositório: um para o backend e outro para o frontend.

### 1. Backend

```bash
cd backend
python -m venv .venv
```

Ative o ambiente virtual:

```bash
# Linux/macOS
source .venv/bin/activate
```

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Instale as dependências e inicie a API:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

A API estará disponível em <http://127.0.0.1:8000>. A documentação interativa do Swagger fica em <http://127.0.0.1:8000/docs>. A base SQLite e as migrações são inicializadas quando a aplicação arranca.

### 2. Frontend

No segundo terminal, a partir da raiz do repositório:

```bash
cd frontend
npm ci
```

Configure o frontend para apontar ao backend local e inicie o Vite:

```bash
cp .env.example .env.local
npm run dev
```

No Windows PowerShell, substitua o comando de cópia por:

```powershell
Copy-Item .env.example .env.local
```

O frontend estará disponível em <http://localhost:5173>. Se alterar a origem da API no ficheiro `.env.local`, reinicie o servidor Vite para que a configuração seja recarregada.

### Acesso inicial de desenvolvimento

O backend disponibiliza a rota `GET /setup` para criar utilizadores de teste:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@acessum.com` | `admin123` |
| Professor | `prof@acessum.com` | `prof123` |
| Aluno | `aluno@acessum.com` | `aluno123` |

Para a utilizar, abra <http://127.0.0.1:8000/setup> **apenas numa base de dados descartável de desenvolvimento**. Esta rota remove os utilizadores existentes quando há menos de três contas; não a execute numa base com dados que queira preservar.

## Estrutura do projeto

```text
backend/   API FastAPI, modelos SQLAlchemy, rotas e migrações SQLite
frontend/  Aplicação React e configuração Vite
docs/      Arquitetura, especificações e documentação do domínio
```

## Documentação

- API: <http://127.0.0.1:8000/docs>, com o backend em execução.
- Especificações: [`docs/specs/`](docs/specs/).
- Arquitetura e padrões: [`docs/ARQUITETURA_LAYOUT.md`](docs/ARQUITETURA_LAYOUT.md).
