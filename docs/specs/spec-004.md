# SPEC-004: Gestão de Equipamentos

**Status:** Concluído (com ressalvas/dívida técnica)
**Objetivo:** Permitir que o Administrador cadastre e remova equipamentos, vinculando-os obrigatoriamente a um laboratório.
**Atores:** Administrador (Exclusivo)

## 1. Regras de Negócio e Modelagem
* **Dependência (RN04):** Um equipamento exige uma Chave Estrangeira (`laboratorio_id`) válida.
* **Restrição de Interface:** O frontend deve permitir apenas a vinculação de equipamentos a laboratórios que estejam com status `ATIVO`.
* **Soft Delete (RN07):** Inativação lógica (`ATIVO` ↔ `INATIVO`).
* **Dívida Técnica (Modelagem):** A entidade `StatusEquipamento` foi simplificada para uma string hardcoded na tabela `Equipamentos` em vez de um Enum nativo.

## 2. Especificação da API (`/api/equipamentos/`)
* `GET /`: Lista todos os equipamentos (Protegido: qualquer utilizador autenticado, conforme a consulta de recursos da SPEC-005). *Dívida Técnica: Faltam query params para paginação/filtros.*
* `POST /`: Cadastra equipamento e valida a existência do laboratório (Protegido: Admin).
* `PATCH /{id}/status`: Alterna o status lógico (Protegido: Admin).

## 3. Especificação de Interface (React)
* **Componente:** `GestaoEquipamentos.jsx`
* **Select Dinâmico:** Requisita `GET /api/laboratorios/` para popular o menu dropdown de vinculação.

## 4. Validação e apresentação
* O nome do equipamento é obrigatório e limitado a 100 caracteres; a descrição é opcional e limitada a 500 caracteres.
* O laboratório selecionado deve existir e estar `ATIVO`; a regra é validada no backend e refletida no frontend.
* A criação inicia o equipamento com status `ATIVO`; a alteração para `INATIVO` ou `ATIVO` é lógica e preserva o registo.
* O frontend apresenta estados de carregamento, lista vazia, sucesso e erro, mostrando o laboratório associado mesmo quando ele tenha sido inativado.