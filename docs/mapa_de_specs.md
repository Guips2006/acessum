# Mapa de Specs — Acessum

> Documento gerado seguindo o processo de Spec-Driven Development (SDD) descrito em `Prompt_SDD_Specs.pdf`.
> Fonte de verdade: artefatos de modelagem no branch `development` (`README.md`, `docs/visao.md`, `docs/personas.md`,
> `docs/requisitos.md`, `docs/dominio.md`, `docs/casos_de_uso/*`).
>
> Este documento apresenta **somente o mapa ordenado de Specs**. Nenhuma Spec individual foi detalhada e nenhum
> código foi gerado. Após aprovação humana deste mapa, cada Spec deve ser gerada individualmente, uma por vez,
> através do prompt complementar.

## Status

- [ ] Mapa aprovado pela equipe
- Última atualização: 2026-09-26

## Decisões incorporadas

Decisões já tomadas pela equipe e aplicadas neste mapa (resolvem ambiguidades encontradas na baseline):

1. Não existe perfil "Técnico" separado; quem aprova reservas é o **Professor**.
2. Fonte de verdade dos casos de uso do Aluno é `casos_de_uso-aluno.md` (laboratórios). O diagrama
   `casos_de_uso-aluno.png` (tema biblioteca) está desatualizado e foi descartado.
3. O **Professor** tem casos de uso próprios de reservar, fazer check-in, devolver e reportar problema — além de
   aprovar/recusar solicitações de terceiros.
4. Equipamento pode ser reservado de forma **independente** do laboratório ao qual pertence (exige ajuste no
   modelo de domínio atual, que hoje só permite reserva de equipamento dentro de uma reserva de laboratório).
5. Serão criados RFs formais para as ações administrativas (hoje existem apenas como casos de uso do Admin, sem
   RF correspondente em `requisitos.md`).
6. Professor e Administrador usam o mesmo fluxo de login genérico já descrito no UC-01 do Aluno (não há casos de
   uso de login separados por perfil).
7. Registro de auditoria das ações é um requisito válido do sistema (citado no diagrama do Admin, ausente em
   `requisitos.md` e no domínio). O mecanismo (o que é logado, quem consulta) permanece em aberto — ver OPEN-13.
8. RNF-01 (resposta < 2s, P95) aplica-se a **todas** as operações do sistema.

## Questões em aberto (OPEN)

| ID | Decisão necessária |
|---|---|
| OPEN-01 | Mecanismo de aprovação de reservas: RF-05 a RF-08 sugerem que toda solicitação passa por análise; RB-03 sugere que só equipamento de uso controlado exige aprovação; README/personas sugerem reserva direta. |
| OPEN-02 | Conjunto formal de estados da reserva: `requisitos.md` usa Pendente/Aprovada/Recusada/Em uso/Concluída/No-show; `dominio.md` usa CONFIRMADA/EM_USO/ENCERRADA/CANCELADA. A issue #13 do repositório trata disso e segue aberta. |
| OPEN-03 | Se "devolver" (README/personas/entidade `Devolucao`) e "encerrar utilização" (RF-09) são a mesma ação ou ações distintas. |
| OPEN-04 | Valor do limite de reservas futuras por aluno (RB-04); deve ser configurável. |
| OPEN-05 | Prazo permitido para cancelamento de reserva (RB-05). |
| OPEN-06 | Janela permitida para check-in (RB-06). |
| OPEN-07 | Quem trata/resolve um `RelatoProblema` e o fluxo Aberto → Em análise → Resolvido; não há RF nem caso de uso para isso hoje. |
| OPEN-08 | Se "remover" usuário (UC06 Admin) é exclusão definitiva ou desativação (usando `StatusUsuario.INATIVO`, já existente no domínio). |
| OPEN-09 | Se a definição de senha inicial (no cadastro pelo Admin) e a recuperação de senha esquecida entram no escopo. |
| OPEN-10 | O modelo de domínio não tem atributo de "uso controlado" em `Equipamento`, necessário para RB-03. |
| OPEN-11 | Não há RF nem caso de uso definindo quem marca um equipamento como "Em manutenção". |
| OPEN-12 | Consequência prática do estado "No-show" (RB-07): é só um registro histórico, ou gera alguma penalidade (ex.: afeta RB-04)? |
| OPEN-13 | Mecanismo do registro de auditoria: o que é logado, formato, quem consulta. |
| OPEN-14 | Nenhum ADR, driver arquitetural ou decisão de stack (frontend/backend/banco/hospedagem) existe na baseline. |
| OPEN-15 | Bootstrap do primeiro Administrador: cadastrar usuário exige estar autenticado como Admin (RF-02), mas não há definição de como o primeiro Admin é criado. |

## RNFs transversais

Não viram Specs próprias — associados às Specs em que se aplicam, conforme regra de decomposição do SDD.

| RNF | Aplicação |
|---|---|
| RNF-01 — Desempenho (< 2s, P95) | Todas as Specs |
| RNF-02 — Autenticação obrigatória | SPEC-001, referenciado por todas as demais |
| RNF-03 — Hash de senha | SPEC-001 |
| RNF-04 — Usabilidade | Todas as Specs |
| RNF-05 — Documentação OpenAPI/Swagger | Todas as Specs que exponham endpoints |
| Auditoria das ações (derivado do diagrama do Admin) | Todas as Specs com ações de criação/alteração/exclusão — mecanismo em OPEN-13 |

## Mapa de Specs

### SPEC-001 — Autenticação e Controle de Acesso
- **Objetivo:** permitir que qualquer perfil (Aluno, Professor, Administrador) se autentique e tenha seu acesso restrito conforme seu perfil.
- **Valor entregue:** segurança e ponto de entrada único do sistema.
- **RF relacionados:** RF-01, RF-02
- **RB relacionadas:** —
- **RNF aplicáveis:** RNF-02, RNF-03
- **Caso de uso / fluxo:** UC-01 (Aluno), generalizado a Professor/Admin
- **Entidades do modelo conceitual:** `Usuario`, `Aluno`, `Professor`, `Administrador`, `StatusUsuario`
- **Drivers arquiteturais:** nenhum registrado (OPEN-14)
- **ADRs:** nenhuma
- **Dependências:** nenhuma
- **Justificativa da posição:** pré-condição de todas as demais funcionalidades.

### SPEC-002 — Gestão de Usuários (Administrador)
- **Objetivo:** permitir que o Admin cadastre, defina o perfil e remova/desative usuários.
- **Valor entregue:** base de contas necessária para qualquer outro fluxo funcionar com usuários reais.
- **RF relacionados:** a criar (decisão tomada de formalizar RF)
- **RB relacionadas:** RN05
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC05, UC06 (Admin)
- **Entidades do modelo conceitual:** `Usuario`, `Aluno`, `Professor`, `Administrador`, `StatusUsuario`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-001
- **Justificativa da posição:** depende de autenticação como Admin; é pré-requisito para existirem contas de Aluno/Professor usadas nas demais Specs.
- **Open relacionado:** OPEN-08, OPEN-09, OPEN-15

### SPEC-003 — Gestão de Laboratórios (Administrador)
- **Objetivo:** permitir que o Admin cadastre e exclua laboratórios.
- **Valor entregue:** recurso reservável passa a existir no sistema.
- **RF relacionados:** a criar
- **RB relacionadas:** RN03, RN07
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC01, UC02 (Admin)
- **Entidades do modelo conceitual:** `Laboratorio`, `StatusLaboratorio`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-001
- **Justificativa da posição:** dado-mestre necessário antes de qualquer consulta ou reserva de laboratório.

### SPEC-004 — Gestão de Equipamentos (Administrador)
- **Objetivo:** permitir que o Admin cadastre e remova equipamentos vinculados a um laboratório.
- **Valor entregue:** equipamentos tornam-se disponíveis para consulta/reserva.
- **RF relacionados:** a criar
- **RB relacionadas:** RN04, RN07
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC03, UC04 (Admin)
- **Entidades do modelo conceitual:** `Equipamento`, `StatusEquipamento`, `Laboratorio`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-003 (equipamento precisa de um laboratório existente, RN04)
- **Justificativa da posição:** depende de já existir laboratório cadastrado.
- **Open relacionado:** OPEN-10, OPEN-11

### SPEC-005 — Consulta de Laboratórios e Equipamentos
- **Objetivo:** permitir que Aluno e Professor consultem os recursos cadastrados e sua situação.
- **Valor entregue:** transparência de recursos disponíveis (dor citada nas personas de Lucas e Mariana).
- **RF relacionados:** RF-03
- **RB relacionadas:** RB-02 (exibição de status)
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-02, UC-03 (Aluno); UC01 (Professor)
- **Entidades do modelo conceitual:** `Laboratorio`, `Equipamento`, `StatusLaboratorio`, `StatusEquipamento`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-004
- **Justificativa da posição:** precisa que laboratórios/equipamentos já existam para serem consultados.

### SPEC-006 — Consulta de Disponibilidade
- **Objetivo:** apresentar horários disponíveis e ocupados de um recurso em um período.
- **Valor entregue:** base para decidir quando reservar, sem depender de terceiros.
- **RF relacionados:** RF-04
- **RB relacionadas:** RB-01, RB-02
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-04 (Aluno); UC02 (Professor)
- **Entidades do modelo conceitual:** `Reserva` (leitura), `Laboratorio`, `Equipamento`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-005
- **Justificativa da posição:** depende da consulta de recursos e precisa existir antes da solicitação de reserva, que reutiliza essa verificação.

### SPEC-007 — Solicitação e Validação de Reserva
- **Objetivo:** permitir que um usuário autenticado (Aluno ou Professor) solicite a reserva de um laboratório ou equipamento.
- **Valor entregue:** autonomia para reservar sem depender de processos informais (dor central da persona Lucas).
- **RF relacionados:** RF-05, RF-06
- **RB relacionadas:** RB-01, RB-02, RB-03, RB-04
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-05 (Aluno), generalizado a Professor
- **Entidades do modelo conceitual:** `Reserva`, `ReservaEquipamento` (requer ajuste de modelo — ver OPEN-10)
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-006
- **Justificativa da posição:** depende da consulta de disponibilidade para checar conflitos antes de registrar a solicitação.
- **Open relacionado:** OPEN-01, OPEN-04, OPEN-10

### SPEC-008 — Análise, Aprovação e Recusa de Solicitações de Reserva
- **Objetivo:** permitir que o Professor analise, aprove ou recuse solicitações de reserva feitas por Alunos.
- **Valor entregue:** controle e organização do uso dos recursos (dor central da persona Mariana).
- **RF relacionados:** RF-07, RF-08
- **RB relacionadas:** RB-01, RB-02, RB-03
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC03, UC04, UC05 (Professor)
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-007
- **Justificativa da posição:** opera sobre solicitações já registradas pela Spec anterior.
- **Open relacionado:** OPEN-01, OPEN-02

### SPEC-009 — Cancelamento de Reserva
- **Objetivo:** permitir que o usuário cancele uma reserva dentro do prazo permitido.
- **Valor entregue:** flexibilidade para liberar o recurso quando não for mais utilizado.
- **RF relacionados:** —
- **RB relacionadas:** RB-05
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-07 (Aluno), generalizado a Professor
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-007
- **Justificativa da posição:** opera sobre reservas já existentes.
- **Open relacionado:** OPEN-05, OPEN-02

### SPEC-010 — Check-in e Início de Utilização
- **Objetivo:** registrar o início da utilização de um recurso reservado.
- **Valor entregue:** rastreabilidade real do uso do recurso.
- **RF relacionados:** RF-09 (parte 1)
- **RB relacionadas:** RB-06, RB-07
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-08 (Aluno), generalizado a Professor
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-008 (exige reserva aprovada)
- **Justificativa da posição:** só faz sentido após a aprovação da reserva.
- **Open relacionado:** OPEN-06, OPEN-02, OPEN-12

### SPEC-011 — Encerramento de Utilização / Devolução
- **Objetivo:** registrar o término da utilização e liberar o recurso.
- **Valor entregue:** fecha o ciclo de uso e atualiza o histórico.
- **RF relacionados:** RF-09 (parte 2)
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-09 (Aluno), generalizado a Professor
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`, `Devolucao` (se distinta — ver OPEN-03)
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-010
- **Justificativa da posição:** encerra o ciclo iniciado pelo check-in.
- **Open relacionado:** OPEN-03, OPEN-02

### SPEC-012 — Histórico de Reservas
- **Objetivo:** permitir que o usuário consulte suas reservas passadas e atuais com status.
- **Valor entregue:** visibilidade e controle sobre o próprio uso dos recursos.
- **RF relacionados:** RF-10
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-06 (Aluno)
- **Entidades do modelo conceitual:** `Reserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-007
- **Justificativa da posição:** consulta somente leitura sobre dados já produzidos; não bloqueia nada, pode ser feita a qualquer momento depois de existirem reservas.

### SPEC-013 — Relato de Problemas
- **Objetivo:** permitir que o usuário reporte problemas em laboratórios ou equipamentos.
- **Valor entregue:** canal simples e rápido de reportar problemas (dor citada por ambas as personas).
- **RF relacionados:** RF-02, RF-03
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-10 (Aluno), generalizado a Professor
- **Entidades do modelo conceitual:** `RelatoProblema`, `StatusProblema`, `Laboratorio`, `Equipamento`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-005
- **Justificativa da posição:** depende apenas de poder referenciar um laboratório/equipamento já consultável; independente do fluxo de reservas.
- **Open relacionado:** OPEN-07

---

## Próximos passos

1. Revisão humana deste mapa (aprovar, ajustar ordem/agrupamento, ou resolver algum OPEN-XX antes de prosseguir).
2. Resolver o quanto possível dos itens OPEN-01 a OPEN-15 — especialmente OPEN-01, OPEN-02 e OPEN-14, que afetam várias Specs.
3. Gerar as Specs individuais, uma de cada vez, usando o prompt complementar (`Gerar SPEC-XXX`), sem misturar criação de Spec com implementação.