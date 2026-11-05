# SPEC-028: Grade semanal de ocupação do laboratório

**Status:** CONCLUÍDO<br>
**Objetivo:** Facilitar a escolha de horários ao mostrar períodos ocupados e livres na semana consultada.<br>
**Atores:** Aluno e Professor.

## 1. Regras de negócio

- A grade usa os intervalos `APROVADA` e `EM_USO` da SPEC-006; pedidos `PENDENTE` não bloqueiam a agenda.
- A resposta representa sete dias a partir de `semana_inicio`, que deve incluir fuso horário. O início da semana selecionada pela interface é segunda-feira no horário local.
- O modelo atual não contém aulas ou turmas nem horários de funcionamento. A grade não inventa esses dados; períodos livres são estimativas baseadas somente nas reservas registradas.
- A consulta é somente leitura e não cria reservas.

## 2. API

- `GET /api/reservas/grade-semanal?recurso_id={id}&semana_inicio={ISO-8601}` retorna laboratório, período de sete dias e blocos livres/ocupados em UTC.
- O cálculo reutiliza as regras da disponibilidade existente; laboratório inexistente ou inativo produz erro explícito.
- **Contrato:** `DisponibilidadeResponse` contém `recurso`, `periodo`, `blocos_livres` e `blocos_ocupados`, com cada intervalo representado por `BlocoDisponibilidade` (`inicio`, `fim`).

## 3. Interface

- A tela de exploração oferece “Ver grade semanal”, com navegação entre semanas e uma visão responsiva dos sete dias.
- O campo de data aceita e apresenta o formato `DD/MM/AAAA`, com validação de data real; o seletor nativo de calendário é separado e sua apresentação visual depende do navegador.
- **Componentes:** modal `GradeSemanal.jsx`, acionado por `ConsultaRecursos.jsx`.
- Os períodos têm texto e legenda além de cores, incluindo carregamento, erro e dias sem reservas.
- A interface informa que horários livres não confirmam horário institucional de funcionamento.

## 4. Validação

- Reservas aprovadas/em uso aparecem como ocupadas; reservas pendentes não aparecem como bloqueio.
- Intervalos fora da semana não são incluídos e intervalos sobrepostos seguem a consolidação da SPEC-006.
- A consulta não altera o banco de dados.
