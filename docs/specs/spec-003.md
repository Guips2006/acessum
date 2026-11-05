# SPEC-003: Gestão de Laboratórios

**Status:** CONCLUÍDO
**Objetivo:** Permitir que o Administrador cadastre e faça a gestão dos laboratórios disponíveis para reserva.
**Atores:** Administrador (Exclusivo)

## 1. Regras de Negócio
* **Unicidade de Identificação:** O sistema rejeita o cadastro de laboratórios com nomes duplicados.
* **Capacidade:** O campo de capacidade (lotação) é numérico e obrigatório.
* **Desativação lógica:** laboratórios inativados mantêm o histórico e não podem receber novas reservas (status `ATIVO` ↔ `INATIVO`).

## 2. Especificação da API (`/api/laboratorios/`)
* `GET /api/laboratorios/`: lista laboratórios com seus equipamentos (`LaboratorioResponse`); consulta autenticada.
* `POST /api/laboratorios/`: recebe `LaboratorioCriar` e retorna `LaboratorioResponse` (Administrador).
* `PATCH /api/laboratorios/{laboratorio_id}/status`: alterna o status e retorna `LaboratorioStatusResponse` (Administrador).

## 3. Especificação de Interface (React)
* **Componente:** `GestaoLaboratorios.jsx`
* **Formulário:** Inputs controlados para Nome e Capacidade.
* **Ações:** Botão de alternância de status dinâmico na tabela de listagem.

## 4. Validação e apresentação
* O nome é obrigatório, limitado a 100 caracteres e não pode duplicar outro laboratório (sem diferenciar maiúsculas de minúsculas).
* A capacidade deve ser um número inteiro maior que zero.
* A criação inicia o laboratório com status `ATIVO`; a alteração de status é lógica (`ATIVO` ↔ `INATIVO`) e preserva o registro.
* O frontend apresenta estados de carregamento, lista vazia, sucesso e erro; solicita confirmação antes de ativar ou inativar.

**Contratos e interface:** `LaboratorioCriar`, `LaboratorioResponse` e `LaboratorioStatusResponse`; `GestaoLaboratorios.jsx`, integrado em `App.jsx`.