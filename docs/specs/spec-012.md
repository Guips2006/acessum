# SPEC-012: Histórico de Reservas

**Status:** CONCLUÍDO<br>
**Objetivo:** Permitir que o usuário consulte suas reservas passadas e futuras, próprias ou compartilhadas, com seus status.<br>
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Escopo de dados:** o usuário consulta as próprias reservas e aquelas em que consta como co-reservante, conforme o filtro aplicado no backend autenticado.
* **Leitura Pura:** Endpoint sem efeitos colaterais.

## 2. API implementada
* `GET /api/reservas/minhas-reservas`: retorna reservas próprias e, para participantes, reservas compartilhadas; inclui laboratório, período, finalidade, status, motivo de recusa, hora efetiva de encerramento e co-reservantes.
* Contrato: lista de `ReservaHistoricoResponse`, com `CoReservanteResponse` quando houver participantes.

## 3. Especificação de Interface (React)
* **Componente:** `HistoricoReservas.jsx`
* Apresenta estados de carregamento, vazio e erro; permite cancelar apenas reservas pendentes/aprovadas dentro do prazo definido na SPEC-009.
* A funcionalidade está disponível para Aluno e Professor; o endpoint não altera dados.

## 4. Extensão — SPEC-029

Para Alunos, a lista inclui também reservas em que o usuário autenticado é co-reservante. O titular é identificado no resultado; visualizar uma reserva compartilhada não concede permissões de alteração.
