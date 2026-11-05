# Casos de Uso — Professor

Este documento resume os fluxos do perfil Professor. Os endpoints, contratos de
dados, regras de autorização e componentes estão descritos nas SPECs individuais
referenciadas no [mapa de SPECs](../mapa_de_specs.md).

## UC-01 — Entrar e consultar recursos

**Ator:** Professor<br>
**Pré-condições:** conta ativa e sessão autenticada.

O Professor consulta laboratórios ativos, equipamentos associados e a
disponibilidade semanal. Equipamentos não possuem reservas ou status de
manutenção independentes.

**SPEC:** SPEC-001, SPEC-005, SPEC-006, SPEC-028.

## UC-02 — Solicitar reserva própria

**Ator:** Professor<br>
**Pré-condições:** sessão autenticada, laboratório ativo e período válido.

1. O Professor informa laboratório, período e finalidade.
2. O sistema valida o período e registra a reserva como `PENDENTE`.
3. A solicitação segue o fluxo de análise vigente.

**SPEC:** SPEC-007, SPEC-008.

## UC-03 — Analisar solicitações pendentes

**Ator:** Professor<br>
**Pré-condições:** sessão autenticada e solicitação `PENDENTE`.

1. O Professor consulta a fila de solicitações pendentes.
2. O Professor examina o laboratório, o período e os dados da solicitação.
3. O Professor aprova ou recusa a solicitação.
4. O sistema valida a transição permitida e atualiza o status da reserva.

Solicitações já processadas não podem receber uma segunda decisão.

**SPEC:** SPEC-008.

## UC-04 — Consultar, cancelar e acompanhar reservas próprias

**Ator:** Professor titular da reserva<br>
**Pré-condições:** sessão autenticada.

O Professor consulta suas reservas e pode cancelar uma reserva `PENDENTE` ou
`APROVADA` até uma hora antes do início. O cancelamento muda o status para
`CANCELADA`. O limite numérico de reservas futuras não está implementado
(OPEN-04).

**SPEC:** SPEC-009, SPEC-012.

## UC-05 — Fazer check-in e encerrar a utilização

**Ator:** Professor titular da reserva<br>
**Pré-condições:** reserva `APROVADA` e sessão autenticada.

O check-in pode ser feito entre 15 minutos antes e 15 minutos depois do início
da reserva. Em seguida, o status passa para `EM_USO`; ao encerrar a utilização,
passa para `CONCLUIDA`. A falta de check-in dentro da janela registra
`NO_SHOW`.

**SPEC:** SPEC-010, SPEC-011, SPEC-016.

## UC-06 — Reportar problema

**Ator:** Professor<br>
**Pré-condições:** sessão autenticada.

O Professor registra um relato relacionado a laboratório, que fica com status
`ABERTO`. A consulta e a resolução administrativa do relato são funções do
Administrador.

**SPEC:** SPEC-013.

## Recursos de interface

As preferências de tema e acessibilidade são compartilhadas pelos perfis
suportados. O Professor não é um perfil de gerenciamento de usuários nem de
auditoria.

**SPEC:** SPEC-014, SPEC-020.
