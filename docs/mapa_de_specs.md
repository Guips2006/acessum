# Mapa de Specs — Acessum

> Documento gerado seguindo o processo de Spec-Driven Development (SDD) descrito em `Prompt_SDD_Specs.pdf`.
> Fonte de verdade da implementação: código atual e SPECs individuais. `docs/visao.md`, `docs/personas.md`,
> `docs/requisitos.md` e `docs/casos_de_uso/*` descrevem a baseline acadêmica e foram alinhados ao escopo
> implementado; diagramas PNG legados não são fonte de verdade.
>
> Este documento acompanha as funcionalidades do MVP até a V2.1. As SPECs 001–013 cobrem o escopo inicial; as
> SPECs 014–029 registram as evoluções implementadas.

## Status

- Mapa de cobertura atualizado com base no código atual
- Cobertura de implementação registrada: SPEC-001 a SPEC-029 — CONCLUÍDO
- Última atualização: 2026-11-04

## Decisões incorporadas

Decisões já tomadas pela equipe e aplicadas neste mapa (resolvem ambiguidades encontradas na baseline):

1. Não existe perfil "Técnico" separado; quem aprova reservas é o **Professor**.
2. Fonte de verdade dos casos de uso do Aluno é `casos_de_uso-aluno.md` (laboratórios). O diagrama
   `casos_de_uso-aluno.png` (tema biblioteca) está desatualizado e foi descartado.
3. O **Professor** tem casos de uso próprios de reservar, fazer check-in, devolver e reportar problema — além de
   aprovar/recusar solicitações de terceiros.
4. A reserva implementada é de laboratório; equipamentos são associados ao laboratório e consultados, mas não
   possuem fluxo de reserva independente.
5. Os RFs de `requisitos.md` ainda representam a baseline acadêmica; os fluxos adicionais estão detalhados nas
   SPECs individuais e não devem ser interpretados como RFs já incorporados àquela baseline.
6. Professor e Administrador usam o mesmo fluxo de login genérico já descrito no UC-01 do Aluno (não há casos de
   uso de login separados por perfil).
7. Auditoria é implementada pela SPEC-020: ações críticas são registradas de forma transacional e a consulta é
   exclusiva do Administrador.
8. RNF-01 (resposta < 2s, P95) aplica-se a **todas** as operações do sistema.

## Questões em aberto e decisões resolvidas

As questões abaixo foram comparadas com os modelos, migrações e rotas atuais. “Encerrada” indica que a decisão
está refletida no comportamento implementado; não implica ampliação do escopo atual.

| ID | Decisão necessária |
|---|---|
| OPEN-01 | **Encerrada:** toda solicitação de reserva de laboratório entra como `PENDENTE`; o Professor aprova ou recusa. O sistema não implementa reserva direta nem reserva individual de equipamento. |
| OPEN-02 | Resolvido: estados da reserva são `PENDENTE`, `APROVADA`, `RECUSADA`, `EM_USO`, `CONCLUIDA`, `CANCELADA` e `NO_SHOW`. |
| OPEN-03 | Resolvido: devolver e encerrar utilização são a mesma ação no MVP; a reserva passa para `CONCLUIDA`. |
| OPEN-04 | **Em aberto:** não há limite configurável de quantidade de reservas futuras implementado. Não presumir nem documentar um número até decisão de produto. |
| OPEN-05 | **Encerrada:** o titular pode cancelar uma reserva `PENDENTE` ou `APROVADA` até uma hora antes do início. |
| OPEN-06 | Resolvido: check-in permitido de 15 minutos antes até 15 minutos depois do início da reserva. |
| OPEN-07 | Resolvido: o Administrador consulta os relatos e pode marcar o status como `RESOLVIDO`; os únicos estados são `ABERTO` e `RESOLVIDO`. |
| OPEN-08 | **Encerrada:** remover usuário significa inativar a conta (`ATIVO`/`INATIVO`); não há exclusão física pela API. |
| OPEN-09 | **Encerrada:** o Administrador cria a conta com senha inicial; a recuperação assistida gera senha temporária e exige troca no próximo acesso (SPEC-022/023). |
| OPEN-10 | **Encerrada por escopo:** não existe atributo de uso controlado nem reserva de equipamento independente; RB-03 não é aplicada pelo fluxo atual. |
| OPEN-11 | **Encerrada por escopo:** equipamentos aceitam somente `ATIVO`/`INATIVO`; não há status nem fluxo de manutenção implementado. |
| OPEN-12 | Resolvido na SPEC-016: três `NO_SHOW` em 30 dias suspendem o Aluno por 7 dias; a regra é reavaliada ao término da suspensão. |
| OPEN-13 | **Encerrada:** SPEC-020 define campos, ações auditadas, consulta administrativa, filtros, paginação e limites de conteúdo sensível. |
| OPEN-14 | **Encerrada:** decisões de stack e bibliotecas estão registradas em `docs/adrs.md`. |
| OPEN-15 | **Encerrada com restrição:** `GET /setup` cria dados de desenvolvimento e pode remover usuários existentes em base descartável; não é fluxo de provisionamento de produção. |

### Lacuna identificada na auditoria

- **Trust Score numérico:** não foi encontrado no código. A SPEC-025 cobre contagem de `NO_SHOW`, faltas restantes e status da conta, mas não calcula ou armazena uma pontuação de confiança. O item não é marcado como concluído nem recebe endpoint, schema ou componente inexistentes.

## Índice de cobertura

Status conferido com as rotas, modelos e componentes atuais. O status CONCLUÍDO significa que o escopo descrito em cada SPEC está presente; não significa que as questões explicitamente mantidas em aberto foram implementadas.

| SPEC | Funcionalidade | Status |
|---|---|---|
| 001 | Autenticação e controle de acesso | CONCLUÍDO |
| 002 | Gestão de usuários | CONCLUÍDO |
| 003 | Gestão de laboratórios | CONCLUÍDO |
| 004 | Gestão de equipamentos | CONCLUÍDO |
| 005 | Consulta de laboratórios e equipamentos | CONCLUÍDO |
| 006 | Consulta de disponibilidade | CONCLUÍDO |
| 007 | Solicitação e validação de reserva | CONCLUÍDO |
| 008 | Aprovação e recusa de reservas | CONCLUÍDO |
| 009 | Cancelamento de reserva | CONCLUÍDO |
| 010 | Check-in e início de utilização | CONCLUÍDO |
| 011 | Encerramento de utilização | CONCLUÍDO |
| 012 | Histórico de reservas | CONCLUÍDO |
| 013 | Relato e gestão de problemas | CONCLUÍDO |
| 014 | Preferências de acessibilidade e carregamento | CONCLUÍDO |
| 015 | Perfil, avatar e atividade | CONCLUÍDO |
| 016 | Penalidade por `NO_SHOW` | CONCLUÍDO |
| 017 | Dashboard administrativo | CONCLUÍDO |
| 018 | Exportação de relatórios | CONCLUÍDO |
| 019 | Notificações in-app | CONCLUÍDO |
| 020 | Auditoria | CONCLUÍDO |
| 021 | Polimento visual e navegação | CONCLUÍDO |
| 022 | Perfil completo e troca de senha | CONCLUÍDO |
| 023 | Cadastro e redefinição assistida de senha | CONCLUÍDO |
| 024 | Bloqueio de datas passadas | CONCLUÍDO |
| 025 | Transparência de faltas e status do aluno | CONCLUÍDO |
| 026 | Atalho de check-in no dashboard do aluno | CONCLUÍDO |
| 027 | Laboratórios favoritos | CONCLUÍDO |
| 028 | Grade semanal de ocupação | CONCLUÍDO |
| 029 | Reservas em grupo com co-reservantes | CONCLUÍDO |

## RNFs transversais

Não viram Specs próprias — associados às Specs em que se aplicam, conforme regra de decomposição do SDD.

| RNF | Aplicação |
|---|---|
| RNF-01 — Desempenho (< 2s, P95) | Todas as Specs |
| RNF-02 — Autenticação obrigatória | SPEC-001, referenciado por todas as demais |
| RNF-03 — Hash de senha | SPEC-001 |
| RNF-04 — Usabilidade | Todas as Specs |
| RNF-05 — Documentação OpenAPI/Swagger | Todas as Specs que exponham endpoints |
| Auditoria das ações | Ações cobertas pela SPEC-020; não presumir que toda mutação gera log. |

## Mapa de Specs

### SPEC-001 — Autenticação e Controle de Acesso
- **Objetivo:** permitir que qualquer perfil (Aluno, Professor, Administrador) se autentique e tenha seu acesso restrito conforme seu perfil.
- **Valor entregue:** segurança e ponto de entrada único do sistema.
- **RF relacionados:** RF-01, RF-02
- **RB relacionadas:** —
- **RNF aplicáveis:** RNF-02, RNF-03
- **Caso de uso / fluxo:** UC-01 (Aluno), generalizado a Professor/Admin
- **Entidades do modelo conceitual:** `Usuario` (perfil e status)
- **Drivers arquiteturais:** FastAPI, SQLAlchemy e SQLite
- **ADRs:** ADR 002, ADR 003 e ADR 005
- **Dependências:** nenhuma
- **Justificativa da posição:** pré-condição de todas as demais funcionalidades.

### SPEC-002 — Gestão de Usuários (Administrador)
- **Objetivo:** permitir que o Administrador cadastre usuários, defina seus perfis e inative ou reative contas.
- **Valor entregue:** base de contas necessária para qualquer outro fluxo funcionar com usuários reais.
- **RF relacionados:** RF-02; gestão administrativa detalhada nesta SPEC
- **RB relacionadas:** unicidade de e-mail e CPF quando informado; desativação lógica
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-01 (Administrador)
- **Entidades do modelo conceitual:** `Usuario` (perfil, dados cadastrais e status)
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** ADR 003 e ADR 005
- **Dependências:** SPEC-001
- **Justificativa da posição:** depende de autenticação como Admin; é pré-requisito para existirem contas de Aluno/Professor usadas nas demais Specs.
- **Decisões registradas:** OPEN-08, OPEN-09 e OPEN-15

### SPEC-003 — Gestão de Laboratórios (Administrador)
- **Objetivo:** permitir que o Administrador cadastre e altere o status dos laboratórios.
- **Valor entregue:** recurso reservável passa a existir no sistema.
- **RF relacionados:** RF-02
- **RB relacionadas:** cadastro único e preservação de vínculos; gerenciamento por status
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-03 (Administrador)
- **Entidades do modelo conceitual:** `Laboratorio` e seu campo `status`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-001
- **Justificativa da posição:** dado-mestre necessário antes de qualquer consulta ou reserva de laboratório.

### SPEC-004 — Gestão de Equipamentos (Administrador)
- **Objetivo:** permitir que o Administrador cadastre equipamentos vinculados a um laboratório e altere seu status.
- **Valor entregue:** equipamentos associados aos laboratórios tornam-se disponíveis para consulta.
- **RF relacionados:** RF-02, RF-03
- **RB relacionadas:** cada equipamento deve estar associado a um laboratório
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-03 (Administrador)
- **Entidades do modelo conceitual:** `Equipamento`, `Laboratorio` e seus campos `status`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-003 (equipamento precisa de um laboratório existente)
- **Justificativa da posição:** depende de já existir laboratório cadastrado.
- **Decisão de escopo:** equipamento é recurso associado ao laboratório; reserva individual e status de manutenção não existem no código atual.

### SPEC-005 — Consulta de Laboratórios e Equipamentos
- **Objetivo:** permitir que Aluno e Professor consultem os recursos cadastrados e sua situação.
- **Valor entregue:** transparência dos laboratórios e equipamentos cadastrados.
- **RF relacionados:** RF-03
- **RB relacionadas:** — (`ATIVO`/`INATIVO` descritos no contrato da SPEC)
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-02 (Aluno); UC-01 (Professor)
- **Entidades do modelo conceitual:** `Laboratorio` e `Equipamento`, com status `ATIVO`/`INATIVO`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-004
- **Justificativa da posição:** precisa que laboratórios/equipamentos já existam para serem consultados.

### SPEC-006 — Consulta de Disponibilidade
- **Objetivo:** apresentar horários disponíveis e ocupados de um recurso em um período.
- **Valor entregue:** base para decidir quando reservar, sem depender de terceiros.
- **RF relacionados:** RF-04
- **RB relacionadas:** RB-01
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-03 (Aluno); UC-01 (Professor)
- **Entidades do modelo conceitual:** `Reserva` (leitura), `Laboratorio`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-005
- **Justificativa da posição:** depende da consulta de recursos e precisa existir antes da solicitação de reserva, que reutiliza essa verificação.

### SPEC-007 — Solicitação e Validação de Reserva
- **Objetivo:** permitir que um usuário autenticado (Aluno ou Professor) solicite a reserva de um laboratório.
- **Valor entregue:** autonomia para reservar sem depender de processos informais (dor central da persona Lucas).
- **RF relacionados:** RF-05, RF-06
- **RB relacionadas:** RB-01 e RB-04 (OPEN-04)
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-04 (Aluno); UC-02 (Professor)
- **Entidades do modelo conceitual:** `Reserva`, `Laboratorio`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-006
- **Justificativa da posição:** depende da consulta de disponibilidade para checar conflitos antes de registrar a solicitação.
- **Open relacionado:** OPEN-04 (limite de reservas futuras não implementado)

### SPEC-008 — Análise, Aprovação e Recusa de Solicitações de Reserva
- **Objetivo:** permitir que o Professor analise, aprove ou recuse solicitações de reserva feitas por Alunos ou Professores.
- **Valor entregue:** controle e organização do uso dos recursos (dor central da persona Mariana).
- **RF relacionados:** RF-07, RF-08
- **RB relacionadas:** RB-01
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-03 (Professor)
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-007
- **Justificativa da posição:** opera sobre solicitações já registradas pela Spec anterior.
- **Decisões registradas:** OPEN-01 e OPEN-02

### SPEC-012 — Histórico de Reservas
- **Objetivo:** permitir que o usuário consulte suas reservas passadas e atuais com status.
- **Valor entregue:** visibilidade e controle sobre o próprio uso dos recursos.
- **RF relacionados:** RF-10
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-05 (Aluno)
- **Entidades do modelo conceitual:** `Reserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-007
- **Justificativa da posição:** cria a interface de consulta onde os usuários acompanham suas reservas e podem iniciar o cancelamento.

### SPEC-009 — Cancelamento de Reserva
- **Objetivo:** permitir que o usuário cancele uma reserva dentro do prazo permitido.
- **Valor entregue:** flexibilidade para liberar o recurso quando não for mais utilizado.
- **RF relacionados:** —
- **RB relacionadas:** RB-05
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-05 (Aluno); UC-04 (Professor)
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-007, SPEC-012
- **Justificativa da posição:** opera sobre reservas já existentes e integra a ação à interface do histórico.
- **Decisões registradas:** OPEN-05 e OPEN-02

### SPEC-010 — Check-in e Início de Utilização
- **Objetivo:** registrar o início da utilização de um recurso reservado.
- **Valor entregue:** rastreabilidade real do uso do recurso.
- **RF relacionados:** RF-09 (parte 1)
- **RB relacionadas:** RB-06, RB-07
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-06 (Aluno); UC-05 (Professor)
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-008 (exige reserva aprovada)
- **Justificativa da posição:** só faz sentido após a aprovação da reserva.
- **Decisão registrada:** OPEN-02
- **Regra definida:** check-in permitido de 15 minutos antes até 15 minutos depois do início; após essa janela, a reserva passa automaticamente a `NO_SHOW`.

### SPEC-011 — Encerramento de Utilização / Devolução
- **Objetivo:** registrar o término da utilização e liberar o recurso.
- **Valor entregue:** fecha o ciclo de uso e atualiza o histórico.
- **RF relacionados:** RF-09 (parte 2)
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-06 (Aluno); UC-05 (Professor)
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-010
- **Justificativa da posição:** encerra o ciclo iniciado pelo check-in.
- **Decisão registrada:** OPEN-02

### SPEC-013 — Relato de Problemas
- **Objetivo:** permitir que o usuário reporte problemas em laboratórios ou equipamentos.
- **Valor entregue:** canal simples e rápido de reportar problemas (dor citada por ambas as personas).
- **RF relacionados:** RF-02, RF-03
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-07 (Aluno); UC-06 (Professor)
- **Entidades do modelo conceitual:** `RelatoProblema`, `StatusProblema`, `Laboratorio`, `Equipamento`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-005
- **Justificativa da posição:** depende apenas de poder referenciar um laboratório/equipamento já consultável; independente do fluxo de reservas.
- **Decisão registrada:** OPEN-07

### SPEC-014 — Preferências de Acessibilidade e Indicadores de Carregamento
- **Objetivo:** permitir que todos os perfis configurem modo escuro e alto contraste, com preferências persistidas no navegador, e recebam feedback uniforme em operações assíncronas.
- **Valor entregue:** interface mais adaptável e estados de carregamento perceptíveis e acessíveis.
- **RF relacionados:** novos requisitos V2.0 definidos em `spec-014.md`
- **RB relacionadas:** —
- **RNF aplicáveis:** RNF-04
- **Caso de uso / fluxo:** Configurar acessibilidade; acompanhar carregamento de telas e ações.
- **Entidades do modelo conceitual:** —
- **Drivers arquiteturais:** React Context API e CSS custom properties existentes.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** nenhuma.
- **Justificativa da posição:** estabelece padrões visuais e de interação reutilizados pelas próximas etapas V2.0.

### SPEC-015 — Perfil, Avatar e Última Atividade
- **Objetivo:** permitir que cada usuário atualize seus dados pessoais permitidos, envie uma foto de perfil e consulte sua última atividade; o e-mail é somente leitura.
- **Valor entregue:** dados pessoais atualizados, identificação visual e rastreabilidade de acesso.
- **RF relacionados:** novos requisitos V2.0 definidos em `spec-015.md`
- **RB relacionadas:** alteração restrita ao usuário autenticado; endereço de e-mail permanece único.
- **RNF aplicáveis:** RNF-02, RNF-04, RNF-05
- **Caso de uso / fluxo:** Meu Perfil; login e chamadas autenticadas atualizam a atividade.
- **Entidades do modelo conceitual:** `Usuario`, `avatar_url`, `ultima_atividade`
- **Drivers arquiteturais:** armazenamento local de estáticos e validação de imagens.
- **ADRs:** ADR 006 — Armazenamento e validação de avatares.
- **Dependências:** SPEC-001 e SPEC-014.
- **Justificativa da posição:** depende da identidade autenticada e dos padrões globais de interface; fornece o mecanismo de upload reutilizável como referência futura.

### SPEC-016 — Penalidade por No-Show
- **Objetivo:** suspender temporariamente Alunos que acumulem três reservas `NO_SHOW` em uma janela móvel de 30 dias.
- **Valor entregue:** responsabilização por faltas e proteção da disponibilidade dos laboratórios.
- **RF relacionados:** novos requisitos V2.0 definidos em `spec-016.md`
- **RB relacionadas:** suspensão por 7 dias; reavaliação da janela móvel no vencimento; chamadas autenticadas permanecem disponíveis, mas novas reservas são bloqueadas.
- **RNF aplicáveis:** RNF-01, RNF-02, RNF-05
- **Caso de uso / fluxo:** Job de ciclo de vida e expiração da janela de check-in registram `NO_SHOW`; autenticação reavalia suspensão vencida.
- **Entidades do modelo conceitual:** `Usuario.status`, `Usuario.suspensao_ate`, `Reserva.data_no_show`
- **Drivers arquiteturais:** job periódico existente e migrações aditivas SQLite.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-007, SPEC-010 e SPEC-015.
- **Justificativa da posição:** depende das reservas/check-in existentes e acrescenta a regra sobre os usuários identificados no fluxo de autenticação.

### SPEC-017 — Dashboard Administrativo
- **Objetivo:** fornecer indicadores de ocupação, reservas por status e evolução diária de `NO_SHOW` para Administradores.
- **Valor entregue:** visão consolidada para acompanhamento operacional dos laboratórios.
- **RF relacionados:** novos requisitos V2.0 definidos em `spec-017.md`
- **RB relacionadas:** somente reservas iniciadas no período entram na distribuição por status; ocupação conta horas de `APROVADA`, `EM_USO` e `CONCLUIDA` em laboratórios ativos, sem sobreposição.
- **RNF aplicáveis:** RNF-01, RNF-02, RNF-04, RNF-05
- **Caso de uso / fluxo:** Dashboard administrativo com intervalo selecionável e período padrão dos últimos 30 dias.
- **Entidades do modelo conceitual:** `Reserva`, `Laboratorio`
- **Drivers arquiteturais:** consultas agregadas no FastAPI e gráficos Recharts.
- **ADRs:** ADR 007 — Gráficos do Dashboard Administrativo.
- **Dependências:** SPEC-003, SPEC-007, SPEC-010 e SPEC-016.
- **Justificativa da posição:** usa o histórico de reservas e a data de `NO_SHOW` produzida pelo ciclo de penalidades.

### SPEC-018 — Exportação de Relatórios
- **Objetivo:** permitir exportar reservas filtradas em CSV ou PDF nos contextos administrativo e de histórico pessoal.
- **Valor entregue:** análise externa e arquivamento dos dados sem ampliar permissões de consulta.
- **RF relacionados:** novos requisitos V2.0 definidos em `spec-018.md`
- **RB relacionadas:** Admin exporta globalmente; Aluno/Professor exporta somente as próprias reservas; período máximo de 366 dias e 10.000 registros.
- **RNF aplicáveis:** RNF-01, RNF-02, RNF-05
- **Caso de uso / fluxo:** Exportar relatório do dashboard ou do histórico com filtros de período/status.
- **Entidades do modelo conceitual:** `Reserva`, `Laboratorio`, `Usuario`
- **Drivers arquiteturais:** CSV padrão Python e PDF paginado.
- **ADRs:** ADR 008 — Geração de relatórios CSV e PDF.
- **Dependências:** SPEC-012 e SPEC-017.
- **Justificativa da posição:** reutiliza o período já selecionado no dashboard e acrescenta filtros ao histórico próprio.

### SPEC-019 — Notificações In-App
- **Objetivo:** informar Alunos sobre decisões de reservas e lembretes de check-in por notificações persistentes no sistema.
- **Valor entregue:** acompanhamento oportuno de decisões e reservas próximas sem depender de e-mail externo.
- **RF relacionados:** novos requisitos V2.0 definidos em `spec-019.md`
- **RB relacionadas:** criar aviso após aprovação/recusa; gerar lembrete ao entrar na janela de 30 minutos; uma notificação por reserva e tipo; somente o titular consulta/altera leitura.
- **RNF aplicáveis:** RNF-01, RNF-02, RNF-04, RNF-05
- **Caso de uso / fluxo:** Sino na barra superior; job periódico; leitura individual ou em lote.
- **Entidades do modelo conceitual:** `Notificacao`, `Usuario`, `Reserva`
- **Drivers arquiteturais:** polling leve do frontend e job periódico já existente no backend.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-008, SPEC-010 e SPEC-015.
- **Justificativa da posição:** usa as decisões e horários das reservas e a identidade do usuário autenticado.

### SPEC-020 — Log de Auditoria
- **Objetivo:** registrar ações críticas com autor, ação, entidade, descrição e data/hora e permitir consulta administrativa.
- **Valor entregue:** rastreabilidade das alterações relevantes no sistema.
- **RF relacionados:** requisito de auditoria derivado do domínio e detalhado em `spec-020.md`
- **RB relacionadas:** criar log na mesma transação da ação; consulta somente por Administrador; logs são imutáveis pela API.
- **RNF aplicáveis:** RNF-01, RNF-02, RNF-05
- **Caso de uso / fluxo:** Escrita transacional nos handlers críticos; consulta paginada e filtrável para Administrador.
- **Entidades do modelo conceitual:** `LogAuditoria`, `Usuario`
- **Drivers arquiteturais:** SQLite e SQLAlchemy existentes; migração aditiva.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-002, SPEC-003, SPEC-008 e SPEC-015.
- **Justificativa da posição:** instrumenta operações administrativas e alterações de perfil já implementadas sem alterar seus resultados.

### SPEC-021 — Polimento Visual e Navegação
- **Objetivo:** corrigir temas e loading, aprimorar marca/paleta e organizar ações da conta em menu de usuário.
- **Valor entregue:** interface consistente, acessível e mais fácil de navegar.
- **RF relacionados:** refinamentos V2.1 descritos em `spec-021.md`
- **RB relacionadas:** Configurações, Meu perfil e Sair ficam no menu do usuário; visão geral acessível ao Aluno.
- **RNF aplicáveis:** RNF-04
- **Caso de uso / fluxo:** Navegação autenticada e configurações de aparência.
- **Entidades do modelo conceitual:** —
- **Drivers arquiteturais:** React Context e Lucide.
- **ADRs:** ADR 009 — Ícones Lucide no frontend.
- **Dependências:** SPEC-014.
- **Justificativa da posição:** prepara a interface para os fluxos de segurança e perfil da V2.1.

### SPEC-022 — Perfil Completo e Troca de Senha
- **Objetivo:** proteger o e-mail como dado imutável, completar dados pessoais, trocar senha e facilitar o envio de avatar.
- **Valor entregue:** perfil consistente e credenciais atualizáveis com segurança.
- **RF relacionados:** fluxos V2.1 descritos em `spec-022.md`
- **RB relacionadas:** e-mail somente leitura; senha atual exigida para troca; senha temporária exige atualização.
- **RNF aplicáveis:** RNF-02, RNF-03, RNF-04
- **Caso de uso / fluxo:** Meu Perfil.
- **Entidades do modelo conceitual:** `Usuario`, `cpf`, `rg`, `data_nascimento`, `deve_trocar_senha`.
- **Drivers arquiteturais:** migração SQLite aditiva existente.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-015 e SPEC-021.
- **Justificativa da posição:** consolida os novos dados e o fluxo de troca depois dos padrões visuais.

### SPEC-023 — Cadastro Seguro e Redefinição de Senha
- **Objetivo:** exigir dados cadastrais validados e oferecer reset de senha com aprovação administrativa e senha temporária.
- **Valor entregue:** cadastro mais robusto e recuperação assistida sem expor existência de contas.
- **RF relacionados:** fluxos V2.1 descritos em `spec-023.md`
- **RB relacionadas:** CPF validado e único; RG normalizado; reset genérico e deduplicado; troca obrigatória da senha temporária.
- **RNF aplicáveis:** RNF-02, RNF-03, RNF-05
- **Caso de uso / fluxo:** UC-02 (Administrador); cadastro, solicitação de redefinição e troca pelo titular.
- **Entidades do modelo conceitual:** `Usuario`, `NotificacaoConta`.
- **Drivers arquiteturais:** FastAPI, SQLite e hash bcrypt existentes.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-001, SPEC-002 e SPEC-022.
- **Justificativa da posição:** o fluxo de recuperação reutiliza autenticação e perfil já protegidos.

### SPEC-024 — Bloqueio de Datas Passadas
- **Objetivo:** impedir que reservas sejam solicitadas para um início no passado.
- **Valor entregue:** menos solicitações inválidas e regra consistente entre interface e API.
- **RF relacionados:** refinamento V2.1 descrito em `spec-024.md`
- **RB relacionadas:** data inicial deve ser futura; data final não pode anteceder o início.
- **RNF aplicáveis:** RNF-04, RNF-05
- **Caso de uso / fluxo:** Solicitar reserva.
- **Entidades do modelo conceitual:** `Reserva.data_inicio`.
- **Drivers arquiteturais:** controles HTML e validação FastAPI existentes.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-007.
- **Justificativa da posição:** é uma validação isolada que completa os fluxos da V2.1.

### SPEC-025 — Transparência de faltas e status da conta do aluno
- **Status:** CONCLUÍDO.
- **Objetivo:** exibir a contagem de no-shows do aluno na janela móvel de 30 dias e a proximidade do limite de suspensão.
- **Valor entregue:** previsibilidade sobre a situação da conta sem alterar a regra de penalidade.
- **RF relacionados:** painel do aluno.
- **RB relacionadas:** SPEC-016 permanece a fonte do limite de três faltas e suspensão por sete dias.
- **RNF aplicáveis:** RNF-02, RNF-04, RNF-05.
- **Entidades do modelo conceitual:** `Usuario`, `Reserva.data_no_show`.
- **API:** `GET /api/dashboard/aluno/resumo`.
- **Contrato:** `DashboardAlunoResponse`; componente `DashboardAluno.jsx`.
- **Dependências:** SPEC-001 e SPEC-016.

### SPEC-026 — Atalho de check-in no Dashboard do Aluno
- **Status:** CONCLUÍDO.
- **Objetivo:** permitir abrir o check-in de uma reserva aprovada próxima do início diretamente pelo Dashboard.
- **Valor entregue:** menos etapas para confirmar presença dentro da janela existente.
- **RB relacionadas:** mantém a janela e titularidade da SPEC-010.
- **RNF aplicáveis:** RNF-02, RNF-04, RNF-05.
- **Entidades do modelo conceitual:** `Reserva`, `Laboratorio`.
- **API:** resumo do aluno e `PATCH /api/reservas/{id}/checkin`.
- **Contrato:** `DashboardAlunoResponse` e `ReservaCheckinProximoResponse`; componente `DashboardAluno.jsx`.
- **Dependências:** SPEC-010 e SPEC-025.

### SPEC-027 — Laboratórios favoritos
- **Status:** CONCLUÍDO.
- **Objetivo:** permitir ao aluno salvar laboratórios e iniciar rapidamente uma solicitação.
- **Valor entregue:** acesso direto aos recursos preferidos sem ignorar as validações da reserva.
- **RB relacionadas:** o atalho abre o formulário; período e finalidade continuam obrigatórios.
- **RNF aplicáveis:** RNF-02, RNF-04, RNF-05.
- **Entidades do modelo conceitual:** `FavoritoUsuario`, `Usuario`, `Laboratorio`.
- **API:** `GET /api/favoritos`; `PUT/DELETE /api/favoritos/{laboratorio_id}`.
- **Contrato:** `FavoritoResponse`; componentes `ConsultaRecursos.jsx` e `DashboardAluno.jsx`.
- **Dependências:** SPEC-001, SPEC-005 e SPEC-007.

### SPEC-028 — Grade semanal de ocupação do laboratório
- **Status:** CONCLUÍDO.
- **Objetivo:** mostrar períodos livres e ocupados em sete dias para apoiar a escolha do horário.
- **Valor entregue:** mais transparência antes de abrir o formulário de reserva.
- **RB relacionadas:** reaproveita SPEC-006; não presume turmas nem horários de funcionamento.
- **RNF aplicáveis:** RNF-02, RNF-04, RNF-05.
- **Entidades do modelo conceitual:** `Laboratorio`, `Reserva`.
- **API:** `GET /api/reservas/grade-semanal`.
- **Contrato:** `DisponibilidadeResponse` e `BlocoDisponibilidade`; componentes `GradeSemanal.jsx` e `ConsultaRecursos.jsx`.
- **Dependências:** SPEC-005 e SPEC-006.

### SPEC-029 — Reservas em grupo com co-reservantes
- **Status:** CONCLUÍDO.
- **Objetivo:** associar alunos a uma reserva e disponibilizá-la no histórico e notificações de cada participante.
- **Valor entregue:** acompanhamento compartilhado sem criar reservas duplicadas.
- **RB relacionadas:** titular mantém permissões de alteração e recebe a penalidade por no-show; participantes têm acesso de leitura e recebem alertas.
- **RNF aplicáveis:** RNF-02, RNF-04, RNF-05; isolamento de dados da SPEC-012.
- **Entidades do modelo conceitual:** `ReservaCoReservante`, `NotificacaoGrupo`, `Usuario`, `Reserva`.
- **API:** busca de alunos, solicitação de reserva com `co_reservante_ids`, histórico e notificações.
- **Contratos:** `AlunoResumoResponse`, `ReservaCriar`, `ReservaHistoricoResponse`, `CoReservanteResponse` e `NotificacaoResponse`; componentes `SolicitarReserva.jsx`, `HistoricoReservas.jsx` e `SininhoNotificacoes.jsx`.
- **Dependências:** SPEC-001, SPEC-007, SPEC-010, SPEC-012 e SPEC-019.

---

## Próximos passos

1. Manter o mapa sincronizado com mudanças futuras em rotas, modelos, migrações e interface.
2. Decidir o limite de reservas futuras por aluno (OPEN-04) antes de alterar ou documentar essa regra como implementada.
