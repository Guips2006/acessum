# SPEC-005: Consulta de Laboratórios e Equipamentos

**Status:** Concluído
**Objetivo:** Permitir aos utilizadores finais a consulta transparente dos recursos cadastrados e suas situações operacionais.
**Atores:** Aluno, Professor (Administrador não acessa esta view).

## 1. Regras de Negócio e Acesso
* **Transparência (RF-03):** Listagem de laboratórios com os seus respectivos equipamentos e status (RB-02).
* **Controlo de Acesso:** Funcionalidade restrita aos perfis `ALUNO` e `PROFESSOR`. A validação é feita diretamente no frontend (`App.jsx`) e as rotas GET no backend exigem apenas token válido (qualquer perfil logado).

## 2. Detalhes de Integração
* **Processamento de Dados:** O backend utiliza a propriedade `relationship` do SQLAlchemy para entregar equipamentos aninhados em cada laboratório; o frontend não realiza o cruzamento dos dados.
* **Carregamento:** A API carrega os equipamentos associados em conjunto com os laboratórios para evitar consultas repetidas.

## 3. Especificação de Interface (React)
* **Componente:** `ConsultaRecursos.jsx`
* **Layout:** Renderização em lista (Cards/Blocos) por laboratório, contendo uma sub-lista dos equipamentos vinculados e as respetivas cores de status.