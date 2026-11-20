# SPEC-008: Análise, Aprovação e Recusa de Solicitações

**Status:** Concluída  
**Objetivo:** Permitir que o Professor analise, aprove ou recuse solicitações de reserva feitas por Alunos ou Professores.  
**Atores:** Professor (Atuando como gestor/aprovador).

## 1. Regras de Negócio e Modelagem
* **Gestão de Status:** Alteração do status da `Reserva` de `PENDENTE` para `APROVADA` ou `RECUSADA`.
* **Resolução de Conflitos:** Ao aprovar, o backend verifica novamente se existe reserva `APROVADA` ou `EM_USO` sobreposta. Em caso de conflito, a aprovação é rejeitada e a solicitação permanece `PENDENTE`.
* As reservas pendentes continuam sem bloquear a agenda; nenhuma recusa automática de outras solicitações pendentes é feita.

## 2. Especificação da API (Proposta)
* `GET /api/reservas/pendentes`: Professor autenticado lista todas as reservas com status `PENDENTE`, incluindo solicitante, laboratório, período e finalidade.
* `PATCH /api/reservas/{id}/analise`: Professor autenticado envia o novo status (`APROVADA` ou `RECUSADA`) e um motivo opcional de recusa.
* Apenas reservas pendentes podem ser analisadas; laboratório inativo ou conflito bloqueante impedem a aprovação.
* O motivo de recusa é persistido quando informado.

## 3. Especificação de Interface (React)
* **Componente:** `AnalisarReservas.jsx`
* **Layout:** Cards de solicitações com solicitante, laboratório, período e finalidade; botões arredondados Aprovar (Verde) e Recusar (Vermelho), campo opcional de motivo de recusa e estados de carregamento/vazio/erro.
* **Acesso:** Entrada da funcionalidade visível apenas ao Professor; chamadas realizadas pela instância `api` do Context API.