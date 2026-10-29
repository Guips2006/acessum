# Mapa de Specs — Acessum

> Documento gerado seguindo o processo de Spec-Driven Development (SDD) descrito em `Prompt_SDD_Specs.pdf`.
> Fonte de verdade: artefatos de modelagem no branch `development` (`README.md`, `docs/visao.md`, `docs/personas.md`,
> `docs/requisitos.md`, `docs/dominio.md`, `docs/casos_de_uso/*`).
>
> Este documento apresenta o mapa de Specs do MVP e da evolução V2.0. As SPECs 001–013 descrevem o escopo do MVP;
> a SPEC-014 registra a primeira entrega V2.0.

## Status

- [ ] Mapa aprovado pela equipe
- Última atualização: 2026-10-29

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
| OPEN-02 | Resolvido: estados da reserva são `PENDENTE`, `APROVADA`, `RECUSADA`, `EM_USO`, `CONCLUIDA`, `CANCELADA` e `NO_SHOW`. |
| OPEN-03 | Resolvido: devolver e encerrar utilização são a mesma ação no MVP; a reserva passa para `CONCLUIDA`. |
| OPEN-04 | Valor do limite de reservas futuras por aluno (RB-04); deve ser configurável. |
| OPEN-05 | Prazo permitido para cancelamento de reserva (RB-05). |
| OPEN-06 | Resolvido: check-in permitido de 15 minutos antes até 15 minutos depois do início da reserva. |
| OPEN-07 | Resolvido: o Administrador consulta os relatos e pode marcar o status como `RESOLVIDO`; os únicos estados são `ABERTO` e `RESOLVIDO`. |
| OPEN-08 | Se "remover" usuário (UC06 Admin) é exclusão definitiva ou desativação (usando `StatusUsuario.INATIVO`, já existente no domínio). |
| OPEN-09 | Se a definição de senha inicial (no cadastro pelo Admin) e a recuperação de senha esquecida entram no escopo. |
| OPEN-10 | O modelo de domínio não tem atributo de "uso controlado" em `Equipamento`, necessário para RB-03. |
| OPEN-11 | Não há RF nem caso de uso definindo quem marca um equipamento como "Em manutenção". |
| OPEN-12 | Resolvido na SPEC-016: três `NO_SHOW` em 30 dias suspendem o Aluno por 7 dias; a regra é reavaliada ao término da suspensão. |
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
- **Objetivo:** permitir que o Admin cadastre, ative e desative laboratórios.
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
- **Justificativa da posição:** cria a interface de consulta onde os usuários acompanham suas reservas e podem iniciar o cancelamento.

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
- **Dependências:** SPEC-007, SPEC-012
- **Justificativa da posição:** opera sobre reservas já existentes e integra a ação à interface do histórico.
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
- **Open relacionado:** OPEN-02
- **Regra definida:** check-in permitido de 15 minutos antes até 15 minutos depois do início; após essa janela, a reserva passa automaticamente a `NO_SHOW`.

### SPEC-011 — Encerramento de Utilização / Devolução
- **Objetivo:** registrar o término da utilização e liberar o recurso.
- **Valor entregue:** fecha o ciclo de uso e atualiza o histórico.
- **RF relacionados:** RF-09 (parte 2)
- **RB relacionadas:** —
- **RNF aplicáveis:** —
- **Caso de uso / fluxo:** UC-09 (Aluno), generalizado a Professor
- **Entidades do modelo conceitual:** `Reserva`, `StatusReserva`
- **Drivers arquiteturais:** nenhum registrado
- **ADRs:** nenhuma
- **Dependências:** SPEC-010
- **Justificativa da posição:** encerra o ciclo iniciado pelo check-in.
- **Open relacionado:** OPEN-02

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
- **Objetivo:** permitir que cada usuário edite seu nome e e-mail, envie uma foto de perfil e consulte o registro de sua última atividade.
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
- **Caso de uso / fluxo:** Cadastro; solicitar reset; Administrador atende; titular troca senha.
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
- **Entidades do modelo conceitual:** `Reserva.inicio`.
- **Drivers arquiteturais:** controles HTML e validação FastAPI existentes.
- **ADRs:** nenhuma dependência nova.
- **Dependências:** SPEC-007.
- **Justificativa da posição:** é uma validação isolada que completa os fluxos da V2.1.

---

## Próximos passos

1. Detalhar e implementar as próximas Specs da V2.0 na ordem de dependência aprovada no Plano Mestre.
2. Resolver as questões abertas relacionadas a cada etapa antes de alterar suas regras de negócio.
