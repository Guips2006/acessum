# Acessum

Sistema web para gestão do acesso e da utilização de laboratórios acadêmicos. O Acessum integra autenticação por perfil, cadastros, disponibilidade, solicitações de reserva, acompanhamento do uso, notificações, auditoria e relatórios.

## Ecossistema

- **Backend:** Python, FastAPI, SQLAlchemy e SQLite.
- **Frontend:** React, JavaScript e Vite.
- **Autenticação:** JWT enviado como `Bearer`; autorização validada nas rotas do backend.
- **Banco local:** `backend/acessum.db`.
- **Documentação:** [mapa de SPECs](docs/mapa_de_specs.md), [modelo de domínio](docs/dominio.md), [arquitetura de interface](docs/ARQUITETURA_LAYOUT.md) e [decisões arquiteturais](docs/adrs.md).

As reservas são feitas para laboratórios. Equipamentos são cadastrados dentro de um laboratório e podem ser consultados, mas não possuem reserva individual nem status de manutenção no fluxo atual.

## Funcionalidades por perfil

### Administrador

- Cadastrar usuários com perfil e dados cadastrais, listar contas e ativá-las/inativá-las.
- Cadastrar e ativar/inativar laboratórios e equipamentos.
- Consultar o dashboard administrativo e exportar relatórios globais de reservas em CSV ou PDF.
- Consultar logs de auditoria e gerenciar relatos de problemas.
- Atender solicitações assistidas de redefinição de senha; a senha temporária é exibida na resposta uma única vez e exige troca.

### Professor

- Explorar laboratórios e equipamentos, consultar disponibilidade e a grade semanal.
- Solicitar reservas de laboratório, consultar o próprio histórico, cancelar, fazer check-in e encerrar a utilização.
- Analisar solicitações pendentes de alunos, aprovando ou recusando.
- Relatar problemas e exportar o próprio histórico em CSV ou PDF.

### Aluno

- Explorar recursos, consultar disponibilidade e ver a grade de ocupação semanal.
- Favoritar laboratórios e solicitar reservas, opcionalmente incluindo outros alunos como co-reservantes.
- Consultar o dashboard pessoal, incluindo faltas por `NO_SHOW`, status da conta e reservas próximas do check-in.
- Consultar reservas próprias e compartilhadas; apenas o titular pode alterar a reserva e recebe eventual penalidade por `NO_SHOW`.
- Cancelar, fazer check-in, encerrar utilização, relatar problemas e exportar o próprio histórico em CSV ou PDF.

### Todos os perfis

- Consultar e atualizar o próprio perfil, incluindo dados cadastrais e avatar.
- Usar modo escuro e alto contraste, navegar com controles acessíveis e receber notificações in-app.
- Solicitar redefinição assistida de senha. Se uma senha temporária for emitida por um Administrador, a troca é obrigatória no próximo acesso.

## Requisitos

- Python 3.10 ou superior.
- Node.js e npm.
- Git.

## Execução local

Abra dois terminais na raiz do repositório, um para o backend e outro para o frontend.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Inicie a API:

```powershell
uvicorn main:app --reload
```

A API ficará disponível em <http://127.0.0.1:8000>. A documentação interativa OpenAPI/Swagger ficará em <http://127.0.0.1:8000/docs>.

Na inicialização, o backend aplica as migrações aditivas do SQLite e cria as tabelas ORM que estiverem ausentes. Para executar explicitamente o mesmo processo, com o ambiente virtual ativado e estando em `backend/`:

```powershell
python -c "import main; print('Migrações SQLite aplicadas.')"
```

A rotina `aplicar_migracoes(engine)` fica em `backend/migrations.py`. Ela verifica colunas e cria estruturas com `IF NOT EXISTS`; não é um sistema de migrações versionadas nem oferece downgrade.

### Frontend

Em outro terminal, a partir da raiz:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

O Vite ficará disponível em <http://localhost:5173>. Ajuste `VITE_API_BASE_URL` em `.env.local` se a API estiver em outro endereço e reinicie o servidor Vite após alterar a configuração.

Para validar a compilação de produção:

```powershell
npm run build
```

### Dados de desenvolvimento

O endpoint `GET /setup` cria usuários de teste. Use-o **somente em uma base descartável local**: a rotina pode remover usuários existentes quando houver menos de três contas. Não execute em uma base com dados a preservar ou em produção. Não há credenciais de produção definidas neste repositório.

## Estrutura do repositório

```text
backend/   API FastAPI, modelos SQLAlchemy, rotas, serviços e migrações SQLite
frontend/  Aplicação React e configuração Vite
docs/      Requisitos, casos de uso, arquitetura, domínio, ADRs e SPECs
```

## Documentação

- [Mapa e cobertura das SPECs](docs/mapa_de_specs.md)
- [SPECs individuais](docs/specs/)
- [Domínio e dicionário de dados](docs/dominio.md)
- [Arquitetura, layout e acessibilidade](docs/ARQUITETURA_LAYOUT.md)
- [Registros de decisão arquitetural](docs/adrs.md)
- [Requisitos](docs/requisitos.md)
