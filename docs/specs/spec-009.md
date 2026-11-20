# SPEC-009: Cancelamento de Reserva

**Status:** Concluída  
**Objetivo:** Permitir que o utilizador cancele uma reserva previamente solicitada ou aprovada.  
**Atores:** Aluno, Professor (Titular da Reserva).

## 1. Regras de Negócio e Modelagem
* **Prazo de Cancelamento (RB-05):** O titular pode cancelar uma reserva `PENDENTE` ou `APROVADA` até uma hora antes do início. O limite exato de uma hora ainda permite cancelamento; depois dele, a API rejeita o pedido.
* **Autorização:** Apenas o titular autenticado, com perfil Aluno ou Professor, pode cancelar a sua reserva. IDs de reservas de outros utilizadores são tratados como não encontrados.
* **Libertação de Recurso:** O status muda para `CANCELADA`; como apenas `APROVADA` e `EM_USO` bloqueiam a agenda, a reserva cancelada deixa de a bloquear imediatamente.

## 2. Especificação da API (Proposta)
* `PATCH /api/reservas/{id}/cancelar`: Aluno ou Professor autenticado cancela a própria reserva, desde que ela esteja `PENDENTE` ou `APROVADA` e falte pelo menos uma hora para o início.
* Reserva inexistente ou pertencente a outro utilizador retorna `404`; estado não cancelável ou prazo excedido retorna `409`.

## 3. Especificação de Interface (React)
* **Integração:** O botão “Cancelar reserva” aparece no componente `HistoricoReservas.jsx` para reservas pendentes/aprovadas que ainda podem ser canceladas. O backend revalida o prazo e o titular.