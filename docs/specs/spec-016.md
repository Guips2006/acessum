# SPEC-016: Penalidade por No-Show

**Status:** Concluída  
**Objetivo:** Suspender temporariamente Alunos após faltas recorrentes a reservas aprovadas.  
**Atores:** Aluno e sistema; o Administrador consulta o status na gestão de usuários.

## 1. Regras de negócio

- Cada transição de `APROVADA` para `NO_SHOW` registra o instante `data_no_show` em UTC.
- Se o titular for Aluno e houver pelo menos três `NO_SHOW` nos 30 dias corridos anteriores ou no instante atual, sua conta passa para `SUSPENSO` por sete dias a partir do gatilho.
- A janela é móvel. No primeiro login ou chamada autenticada após `suspensao_ate`, o sistema reavalia os últimos 30 dias: se ainda houver pelo menos três faltas, inicia outro período de sete dias; caso contrário, reativa a conta.
- Usuários suspensos podem autenticar e consultar funcionalidades existentes, mas não podem criar novas reservas. A regra é aplicada no backend e refletida na interface.
- Professores e Administradores não recebem essa penalidade. Usuários inativos continuam sujeitos às regras existentes de inativação.
- A falta pode ser registrada pelo job periódico de expiração ou pelo fluxo de check-in fora da janela; ambos usam a mesma operação de domínio para evitar contagens divergentes.

## 2. Persistência e compatibilidade

- `usuarios` recebe `suspensao_ate` como coluna anulável; `reservas` recebe `data_no_show` como coluna anulável, ambas via migração aditiva e idempotente.
- Para reservas legadas já marcadas `NO_SHOW`, `data_no_show` é estimada como `data_inicio + 15 minutos`, preservando o status e demais valores.
- Um índice composto em usuário, status e data de no-show permite filtrar a janela móvel.
- Nenhuma tabela é reconstruída e dados existentes permanecem preservados.

## 3. Validação

- Testar suspensão no terceiro no-show dentro da janela, com prazo exato de sete dias.
- Confirmar que duas faltas recentes e uma fora dos 30 dias não suspendem.
- Confirmar que Professor não é suspenso e que a expiração reavalia a janela móvel.
- Confirmar que uma conta suspensa recebe `403` ao solicitar reserva, mas ainda pode autenticar e consultar o histórico.
- Rodar a migração repetidamente e verificar preservação e backfill das reservas legadas.