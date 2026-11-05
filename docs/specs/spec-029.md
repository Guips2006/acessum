# SPEC-029: Reservas em grupo com co-reservantes

**Status:** CONCLUÍDO<br>
**Objetivo:** Permitir que um aluno associe outros alunos à mesma reserva e que todos acompanhem o agendamento.<br>
**Atores:** Aluno titular, alunos co-reservantes, Professor e sistema.

## 1. Persistência e compatibilidade

- `reserva_co_reservantes` relaciona `reserva_id` e `usuario_id` por chave composta, impedindo associações duplicadas.
- Notificações individuais de participantes usam a tabela aditiva `notificacoes_grupo`, com unicidade em `(reserva_id, usuario_id, tipo)`. A tabela existente `notificacoes` não é reconstruída nem tem sua restrição alterada.
- Todas as tabelas e índices são criados idempotentemente por `backend/migrations.py`.

## 2. Regras de negócio

- A solicitação continua sendo uma única `Reserva`, com seu solicitante como titular. Apenas alunos podem incluir co-reservantes; cada pessoa selecionada precisa ser outro aluno ativo.
- A validação de período, finalidade, conflito, aprovação e titularidade segue as SPECs 007 e 024.
- A reserva aparece no histórico do titular e de cada co-reservante. O titular continua sendo o único que pode cancelar, encerrar ou fazer check-in.
- No-show e penalidade continuam associados ao titular, conforme as SPECs 010 e 016. A participação no grupo não transfere nem multiplica a penalidade.
- Decisões de aprovação/recusa e lembretes de check-in são notificados ao titular pelo mecanismo atual e aos co-reservantes pela tabela aditiva.

## 3. API e interface

- `GET /api/alunos/busca?termo={nome-ou-email}` retorna até dez alunos ativos para uso pelo titular autenticado.
- `POST /api/reservas/` aceita `co_reservante_ids` opcional e cria a reserva e os vínculos na mesma transação.
- `GET /api/reservas/minhas-reservas` inclui reservas próprias e compartilhadas, identificando o titular e os co-reservantes.
- A busca de co-reservantes é opcional. A interface mostra quem foi selecionado e permite remover pessoas antes de enviar.
- As notificações de grupo usam o contrato da SPEC-019; o sino continua filtrando mensagens pelo usuário autenticado.
- **Contratos:** `POST /api/reservas/` recebe `ReservaCriar` com `co_reservante_ids`; histórico usa `ReservaHistoricoResponse` com `CoReservanteResponse`; busca retorna `AlunoResumoResponse`; notificações usam `NotificacaoResponse`.
- **Componentes:** `SolicitarReserva.jsx`, `HistoricoReservas.jsx` e `SininhoNotificacoes.jsx`.

## 4. Validação

- Não é possível incluir o solicitante, usuários inexistentes/inativos, perfis diferentes de Aluno ou IDs repetidos.
- Cada co-reservante consulta a reserva no próprio histórico, sem ganhar permissão para alterar o agendamento.
- Notificações de aprovação/recusa/check-in chegam a cada participante sem duplicação por reexecução.
- As rotas preservam isolamento entre grupos e usuários.
