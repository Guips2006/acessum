# SPEC-012: Histórico de Reservas

**Status:** Concluída  
**Objetivo:** Permitir que o utilizador consulte as suas reservas (passadas e futuras) com os respetivos status.  
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Isolamento de Dados:** O utilizador só pode ver as suas próprias reservas (filtragem pelo `usuario_id` injetado pelo Token JWT).
* **Leitura Pura:** Endpoint sem efeitos colaterais.

## 2. Especificação da API (Proposta)
* `GET /api/reservas/minhas-reservas`: Extrai o ID do utilizador do token HTTPBearer, retorna somente as reservas desse titular e inclui laboratório, período, finalidade, estado, motivo de recusa e hora efetiva de encerramento quando aplicável.

## 3. Especificação de Interface (React)
* **Componente:** `HistoricoReservas.jsx`
* Apresenta estados de carregamento, vazio e erro; permite cancelar apenas reservas pendentes/aprovadas dentro do prazo definido na SPEC-009.
* A funcionalidade está disponível para Aluno e Professor; o endpoint não altera dados.
