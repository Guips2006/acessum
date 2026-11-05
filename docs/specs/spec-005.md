# SPEC-005: Consulta de Laboratórios e Equipamentos

**Status:** CONCLUÍDO
**Objetivo:** Permitir que alunos e professores consultem os recursos cadastrados e seus status.
**Atores:** Aluno e Professor.

## 1. Regras de Negócio e Acesso
* **Transparência (RF-03):** listagem de laboratórios com equipamentos associados e respectivos status.
* **Controle de acesso:** a navegação de consulta é oferecida a `ALUNO` e `PROFESSOR`; os endpoints de leitura exigem autenticação válida. A API continua sendo responsável por autorizar cada operação.

## 2. Detalhes de Integração
* **Processamento de Dados:** O backend utiliza a propriedade `relationship` do SQLAlchemy para entregar equipamentos aninhados em cada laboratório; o frontend não realiza o cruzamento dos dados.
* **Carregamento:** A API carrega os equipamentos associados em conjunto com os laboratórios para evitar consultas repetidas.

## 3. Especificação de Interface (React)
* **Componente:** `ConsultaRecursos.jsx`
* **Layout:** cartões de laboratório com lista de equipamentos vinculados e seus status.

**Contratos:** `GET /api/laboratorios/` retorna `LaboratorioResponse` com equipamentos `EquipamentoResponse`; `GET /api/equipamentos/` retorna `EquipamentoResponse`. Componentes: `ConsultaRecursos.jsx` e `ConsultaDisponibilidade.jsx`.