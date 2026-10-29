# SPEC-013: Relato de Problemas

**Status:** Concluída  
**Objetivo:** Criar um canal rápido para reportar defeitos em laboratórios ou equipamentos.  
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Entidade:** `RelatoProblema` associa o autor a exatamente um laboratório ou equipamento, com descrição, severidade, data/hora e status.
* **Status:** Apenas `ABERTO` e `RESOLVIDO`.
* **Severidade:** `BAIXA`, `MEDIA` ou `ALTA`.
* **Independência:** Pode ser relatado independentemente de haver uma reserva ativa.

## 2. Especificação da API
* `POST /api/problemas/`: Aluno ou professor autenticado envia `tipo_recurso` (`LABORATORIO` ou `EQUIPAMENTO`), `recurso_id`, `descricao` e `nivel_severidade`.
* `GET /api/problemas/`: Apenas Admin; lista relatos com autor, recurso, data/hora, severidade e status.
* `PATCH /api/problemas/{id}/status`: Apenas Admin; atualiza o status para `ABERTO` ou `RESOLVIDO`.
* A API deriva o autor do token e rejeita recursos inexistentes; reportar um problema não exige reserva ativa nem recurso ativo.

## 3. Especificação de Interface (React)
* **Componentes:** `RelatarProblema.jsx` e `GestaoProblemas.jsx`.
* **Relato:** Formulário acionado pelo botão ⚠️ nos cards de laboratório e equipamento na consulta de recursos.
* **Administração:** Cards de relatos com recurso, autor, data/hora, severidade e status; Admin pode marcar um relato como resolvido ou reabri-lo.
* **Comunicação:** Todas as chamadas usam a instância `api` do `AuthContext`.