# SPEC-007: Solicitação e Validação de Reserva

**Status:** Concluída  
**Objetivo:** Permitir que utilizadores autenticados solicitem a reserva de laboratórios ou equipamentos.  
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Prevenção de Conflitos (RB-01, RB-02):** O backend deve validar se o recurso já está reservado no horário solicitado antes de persistir (evitar *double-booking*).
* **Fluxo de Aprovação:** Reservas de Alunos e Professores entram com status `PENDENTE` e aguardam análise.
* **Modelagem:** MVP usa tabela unificada `Reserva`, vinculada obrigatoriamente a um laboratório; equipamentos não são reservados de forma independente.
* **Disponibilidade:** Apenas reservas `APROVADA` e `EM_USO` bloqueiam agenda; reservas pendentes não bloqueiam a consulta de disponibilidade.
* **Conflito:** A API rejeita um pedido que se sobreponha a uma reserva `APROVADA` ou `EM_USO`; períodos podem sobrepor solicitações `PENDENTE`.
* **Limite de reservas:** O valor máximo referido em RB-04 não foi definido; esta etapa não inventa nem aplica um limite numérico.

## 2. Especificação da API (Proposta)
* `POST /api/reservas/`: Aluno ou Professor autenticado envia `recurso_id` (laboratório), `data_inicio`, `data_fim` com fuso horário e `finalidade`. O autor vem do token.
* O endpoint valida laboratório existente e ativo, período e choque com reservas aprovadas/em uso. Cria o pedido com status `PENDENTE`.
* A coluna `finalidade` é adicionada por migração SQLite aditiva; reservas já existentes recebem o texto `Reserva legada sem finalidade informada`.

## 3. Especificação de Interface (React)
* **Componente:** `SolicitarReserva.jsx`
* **Formulário:** Inputs nativos (`type="datetime-local"`) e campo de finalidade no card do laboratório selecionado. O frontend envia datas em UTC ISO-8601 e apresenta confirmação ou erro de conflito.