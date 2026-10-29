# SPEC-003: Gestão de Laboratórios

**Status:** Concluído
**Objetivo:** Permitir que o Administrador cadastre e faça a gestão dos laboratórios disponíveis para reserva.
**Atores:** Administrador (Exclusivo)

## 1. Regras de Negócio
* **Unicidade de Identificação:** O sistema rejeita o cadastro de laboratórios com nomes duplicados.
* **Capacidade:** O campo de capacidade (lotação) é numérico e obrigatório.
* **Soft Delete:** Laboratórios inativados mantêm o histórico, mas bloqueiam lógicas futuras de reserva (status `ATIVO` ↔ `INATIVO`).

## 2. Especificação da API (`/api/laboratorios/`)
* `GET /`: Lista todos os laboratórios cadastrados (Protegido: qualquer utilizador autenticado, conforme a consulta de recursos da SPEC-005).
* `POST /`: Cadastra novo laboratório (Nome, Capacidade) (Protegido: Admin).
* `PATCH /{id}/status`: Alterna o status lógico (Protegido: Admin).

## 3. Especificação de Interface (React)
* **Componente:** `GestaoLaboratorios.jsx`
* **Formulário:** Inputs controlados para Nome e Capacidade.
* **Ações:** Botão de alternância de status dinâmico na tabela de listagem.

## 4. Validação e apresentação
* O nome é obrigatório, limitado a 100 caracteres e não pode duplicar outro laboratório (ignorando diferenças de maiúsculas/minúsculas).
* A capacidade deve ser um número inteiro maior que zero.
* A criação inicia o laboratório com status `ATIVO`; a alteração de status é lógica (`ATIVO` ↔ `INATIVO`) e preserva o registo.
* O frontend apresenta estados de carregamento, lista vazia, sucesso e erro; solicita confirmação antes de ativar ou inativar.