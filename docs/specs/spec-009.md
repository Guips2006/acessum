# SPEC-009: Cancelamento de Reserva

**Status:** CONCLUÍDO<br>
**Objetivo:** Permitir que o titular cancele uma reserva pendente ou aprovada até uma hora antes do início.<br>
**Atores:** Aluno, Professor (Titular da Reserva).

## 1. Regras de Negócio e Modelagem
* **Prazo de Cancelamento (RB-05):** O titular pode cancelar uma reserva `PENDENTE` ou `APROVADA` até uma hora antes do início. O limite exato de uma hora ainda permite cancelamento; depois dele, a API rejeita o pedido.
* **Autorização:** somente o titular autenticado, com perfil Aluno ou Professor, pode cancelar a própria reserva. IDs de reservas de outros usuários são tratados como não encontrados.
* **Liberação do laboratório:** o status muda para `CANCELADA`; como apenas `APROVADA` e `EM_USO` bloqueiam a agenda, a reserva cancelada deixa de bloqueá-la imediatamente.

## 2. API implementada
* `PATCH /api/reservas/{id}/cancelar`: Aluno ou Professor autenticado cancela a própria reserva, desde que ela esteja `PENDENTE` ou `APROVADA` e falte pelo menos uma hora para o início.
* A resposta usa `ReservaHistoricoResponse`.
* Reserva inexistente ou pertencente a outro usuário retorna `404`; estado não cancelável ou prazo excedido retorna `409`.

## 3. Especificação de Interface (React)
* **Integração:** O botão “Cancelar reserva” aparece no componente `HistoricoReservas.jsx` para reservas pendentes/aprovadas que ainda podem ser canceladas. O backend revalida o prazo e o titular.
