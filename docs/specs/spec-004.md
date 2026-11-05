# SPEC-004: Gestão de Equipamentos

**Status:** CONCLUÍDO
**Objetivo:** Permitir que o Administrador cadastre equipamentos e altere seu status, vinculando-os obrigatoriamente a um laboratório.
**Atores:** Administrador (Exclusivo)

## 1. Regras de Negócio e Modelagem
* **Dependência:** um equipamento exige uma chave estrangeira (`laboratorio_id`) válida.
* **Restrição de Interface:** O frontend deve permitir apenas a vinculação de equipamentos a laboratórios que estejam com status `ATIVO`.
* **Desativação lógica:** alternância entre `ATIVO` e `INATIVO`, sem exclusão física.
* O status é persistido como texto, sem tabela de enumeração. A API usa `ATIVO` e `INATIVO`; não há status de manutenção nem reserva individual de equipamento.

## 2. Especificação da API (`/api/equipamentos/`)
* `GET /api/equipamentos/`: lista equipamentos; exige autenticação.
* `POST /api/equipamentos/`: recebe `EquipamentoCriar` e retorna `EquipamentoResponse` (Administrador).
* `PATCH /api/equipamentos/{equip_id}/status`: alterna para `ATIVO` ou `INATIVO` e retorna `EquipamentoStatusResponse` (Administrador).

## 3. Especificação de Interface (React)
* **Componente:** `GestaoEquipamentos.jsx`
* **Select Dinâmico:** Requisita `GET /api/laboratorios/` para popular o menu dropdown de vinculação.

## 4. Validação e apresentação
* O nome do equipamento é obrigatório e limitado a 100 caracteres; a descrição é opcional e limitada a 500 caracteres.
* O laboratório selecionado deve existir e estar `ATIVO`; a regra é validada no backend e refletida no frontend.
* A criação inicia o equipamento com status `ATIVO`; a alteração para `INATIVO` ou `ATIVO` é lógica e preserva o registro.
* O frontend apresenta estados de carregamento, lista vazia, sucesso e erro, mostrando o laboratório associado mesmo quando ele estiver inativo.

**Interface:** `GestaoEquipamentos.jsx`; consulta dos equipamentos também aparece em `ConsultaRecursos.jsx`.