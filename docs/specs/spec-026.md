# SPEC-026: Atalho de check-in no Dashboard do Aluno

**Status:** CONCLUÍDO<br>
**Objetivo:** Dar acesso rápido ao check-in de uma reserva aprovada próxima do início.<br>
**Atores:** Aluno e sistema.

## 1. Regras de negócio

- O painel destaca reservas próprias aprovadas cujo início esteja a até 30 minutos, incluindo o período de tolerância de até 15 minutos após o horário.
- A autorização e a janela efetiva continuam sendo validadas pela API existente da SPEC-010: somente o titular faz check-in, de 15 minutos antes a 15 minutos depois do início.
- O atalho não altera as regras de check-in nem evita a transição para `NO_SHOW`.

## 2. API e interface

- O `GET /api/dashboard/aluno/resumo` da SPEC-025 retorna as reservas próprias dentro do intervalo de destaque.
- O botão “Confirmar presença” chama `PATCH /api/reservas/{id}/checkin` e apresenta o resultado retornado pelo servidor.
- O painel atualiza a lista periodicamente enquanto está aberto e após a ação.
- **Contrato:** `DashboardAlunoResponse.reservas_checkin` contém itens `ReservaCheckinProximoResponse` (`id`, `laboratorio_nome`, `data_inicio`); check-in usa `ReservaHistoricoResponse`.
- **Interface:** atalho e painel em `DashboardAluno.jsx`; histórico em `HistoricoReservas.jsx`.

## 3. Validação

- Reservas fora do período de destaque não aparecem no card.
- A API rejeita tentativa anterior ou posterior à janela, mesmo quando iniciada pelo atalho.
- Uma reserva em uso ou encerrada deixa de ser apresentada como aguardando check-in.
