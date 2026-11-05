# SPEC-010: Check-in e Início de Utilização

**Status:** CONCLUÍDO<br>
**Objetivo:** Registrar o início efetivo da utilização de um recurso reservado.<br>
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Rastreabilidade (RB-06, RB-07):** Muda o status de `APROVADA` para `EM_USO`.
* **Janela de Check-in:** É permitido de 15 minutos antes até 15 minutos depois do início agendado, incluindo ambos os limites.
* **No-show:** Após o limite final da janela, uma reserva ainda `APROVADA` passa automaticamente para `NO_SHOW`. O backend executa uma reconciliação periódica (até um minuto após o limite); uma tentativa tardia de check-in também marca a reserva como `NO_SHOW` imediatamente.
* **Titularidade:** Apenas o Aluno ou Professor titular autenticado pode fazer check-in da própria reserva.
* **Transições válidas:** Somente reservas `APROVADA` podem transitar para `EM_USO`; outras situações não alteram o estado.

## 2. API implementada
* `PATCH /api/reservas/{id}/checkin`: O titular faz check-in na janela permitida e o status passa para `EM_USO`.
* A resposta usa `ReservaHistoricoResponse`.
* Antes da janela ou após check-in/encerramento/cancelamento, a API rejeita a ação sem alteração indevida. Após a janela, o status é `NO_SHOW` e a API informa que a tolerância expirou.

## 3. Especificação de Interface (React)
* **Integração:** Botão “Fazer check-in” no histórico, visível somente para uma reserva `APROVADA` dentro da janela. A API revalida titularidade, estado e horário no servidor.

## 4. Extensão — SPEC-026 e SPEC-029

O Dashboard oferece um atalho para o mesmo endpoint e a mesma janela de check-in. Em reservas compartilhadas, somente o titular pode fazer check-in; co-reservantes recebem alertas, mas não alteram o estado da reserva.
