# SPEC-006: Consulta de Disponibilidade

**Status:** Concluída  
**Objetivo:** Apresentar horários disponíveis e ocupados de um laboratório num determinado período.  
**Atores:** Aluno, Professor.

## 1. Regras de Negócio e Modelagem
* **Transparência (RB-01, RB-02):** O sistema cruza reservas do laboratório selecionado para calcular lacunas livres dentro do intervalo solicitado.
* **Reservas bloqueantes:** Apenas reservas com status `APROVADA` ou `EM_USO` bloqueiam a agenda. Reservas `PENDENTE` não são apresentadas como ocupadas.
* **MVP:** A reserva é feita ao nível do laboratório; os equipamentos são apresentados com o respetivo laboratório e não possuem agenda independente nesta etapa.
* **Leitura Apenas:** Esta spec não altera estado nem cria reservas.
* **Dependência:** Exige a existência dos recursos (SPEC-005).

## 2. Especificação da API
* `GET /api/reservas/disponibilidade`: Recebe `recurso_id` (ID do laboratório), `data_inicio` e `data_fim` em ISO-8601 com fuso horário.
* A resposta contém o recurso, o intervalo consultado e listas `blocos_livres` e `blocos_ocupados`, com instantes UTC.
* Os intervalos são recortados à janela consultada; intervalos ocupados sobrepostos ou contíguos são consolidados antes do cálculo de lacunas.
* O endpoint é apenas de leitura e acessível a alunos e professores autenticados; laboratório inexistente ou inativo produz erro explícito.
* O endpoint não presume horário de funcionamento nem cria slots fixos: os blocos livres são as lacunas entre o início e fim pedidos e as reservas bloqueantes.

## 3. Especificação de Interface (React)
* **Componente:** `ConsultaDisponibilidade.jsx`, integrado como seção no card do laboratório em `ConsultaRecursos.jsx`.
* **Datas:** Inputs nativos `datetime-local`; o frontend converte os valores locais para UTC ISO-8601 ao enviar a consulta.
* **Layout:** Cards de horários ocupados em cinza e horários livres em verde, com estados de erro e carregamento.