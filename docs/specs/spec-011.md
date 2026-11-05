# SPEC-011: Encerramento de Utilização / Devolução

**Status:** CONCLUÍDO<br>
**Objetivo:** Registrar o término da utilização e liberar o laboratório no sistema.<br>
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Fim de Ciclo:** O titular encerra a utilização; a reserva muda de `EM_USO` para `CONCLUIDA`.
* **Devolução:** Para o MVP, encerramento e devolução são a mesma ação e não há entidade de devolução separada nem validação de integridade física.
* **Rastreabilidade:** O sistema guarda `data_fim_real` em UTC para registrar quando a utilização foi efetivamente encerrada.
* **Titularidade:** Apenas o Aluno ou Professor titular autenticado pode encerrar a própria reserva.

## 2. API implementada
* `PATCH /api/reservas/{id}/encerrar`: Só aceita uma reserva própria em estado `EM_USO`; atualiza o estado para `CONCLUIDA` e grava `data_fim_real`.
* A resposta usa `ReservaHistoricoResponse`.
* Reserva inexistente ou de outro usuário retorna `404`; estado diferente de `EM_USO` retorna `409`.
* A coluna `data_fim_real` é adicionada por migração SQLite aditiva.

## 3. Especificação de Interface (React)
* **Integração:** No histórico, o botão “Fazer check-in” deixa de aparecer após o estado passar para `EM_USO`; nesse estado aparece “Encerrar utilização”. Após concluir, o histórico apresenta a hora efetiva de encerramento.
