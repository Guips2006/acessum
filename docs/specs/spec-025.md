# SPEC-025: Transparência de faltas e status da conta do aluno

**Status:** CONCLUÍDO<br>
**Objetivo:** Mostrar ao aluno a contagem de faltas por no-show na janela móvel de 30 dias e a proximidade do limite de suspensão.<br>
**Atores:** Aluno e sistema.

## 1. Regras de negócio

- A contagem considera somente reservas do aluno autenticado com status `NO_SHOW` e `data_no_show` entre agora menos 30 dias e agora, em UTC.
- O limite permanece o da SPEC-016: três faltas na janela móvel podem suspender o aluno por sete dias.
- O painel exibe quantidade de faltas, faltas restantes até o limite e o status atual da conta. A contagem não cria nem altera faltas, status ou suspensão.
- O acesso é restrito ao aluno autenticado; nenhum parâmetro permite consultar a conta de outra pessoa.
- A funcionalidade não calcula nem persiste uma pontuação numérica de confiança ("Trust Score"); apresenta somente a contagem de faltas e o status da conta.

## 2. API

- `GET /api/dashboard/aluno/resumo`: retorna faltas recentes, limite, faltas restantes, status da conta, eventual término da suspensão e reservas próprias próximas do check-in.
- O endpoint exige perfil `ALUNO` e usa a regra de cálculo existente da SPEC-016.

## 3. Interface

- O Dashboard do Aluno mostra `N/3 faltas registradas nos últimos 30 dias` e estado textual regular, de atenção ou suspenso.
- Avisos combinam texto, ícone e cor; a informação continua compreensível em modo claro, escuro e alto contraste.
- **Contrato da API:** `GET /api/dashboard/aluno/resumo` responde com `DashboardAlunoResponse`: `faltas_no_periodo`, `limite_no_show`, `faltas_restantes`, `status_conta`, `suspensao_ate` e `reservas_checkin`.
- **Interface:** `DashboardAluno.jsx`, integrado em `App.jsx`.

## 4. Validação

- Uma falta na janela e outra anterior a 30 dias resulta em contagem igual a um.
- Usuários de outro perfil ou não autenticados não acessam o resumo.
- Consultar o painel não modifica reservas nem a conta.
