# Casos de Uso — Administrador

Este documento resume os fluxos administrativos. Os endpoints, contratos de
dados, regras de autorização e componentes estão descritos nas SPECs individuais
referenciadas no [mapa de SPECs](../mapa_de_specs.md).

## UC-01 — Gerenciar usuários

**Ator:** Administrador<br>
**Pré-condições:** conta ativa e sessão autenticada.

1. O Administrador consulta a lista de usuários.
2. Pode cadastrar uma conta informando nome, e-mail, perfil e dados
   cadastrais requeridos pelo formulário.
3. Pode alterar o status da conta entre `ATIVO` e `INATIVO`.
4. O sistema preserva os registros relacionados à conta; a desativação é
   lógica, não uma exclusão física.

**SPEC:** SPEC-002, SPEC-022.

## UC-02 — Redefinir senha de um usuário

**Ator:** Administrador<br>
**Pré-condições:** sessão autenticada e conta de destino existente.

O Administrador gera uma senha temporária aleatória, exibida uma única vez.
Somente o hash é armazenado. No acesso seguinte, a pessoa deve definir uma nova
senha antes de continuar.

**SPEC:** SPEC-023.

## UC-03 — Gerenciar laboratórios e equipamentos

**Ator:** Administrador<br>
**Pré-condições:** sessão autenticada.

O Administrador cadastra laboratórios, altera seu status, cadastra equipamentos
associados a laboratórios e altera o status dos equipamentos. O sistema preserva
os registros por meio dos status `ATIVO` e `INATIVO`; não há status de
manutenção nem reserva individual de equipamentos.

**SPEC:** SPEC-003, SPEC-004.

## UC-04 — Consultar relatos de problemas

**Ator:** Administrador<br>
**Pré-condições:** sessão autenticada.

1. O Administrador consulta os relatos enviados por Alunos ou Professores.
2. O sistema apresenta os dados do relato e seu status.
3. O Administrador altera o status de `ABERTO` para `RESOLVIDO`.

**SPEC:** SPEC-013.

## UC-05 — Acompanhar indicadores e exportar relatórios

**Ator:** Administrador<br>
**Pré-condições:** sessão autenticada.

1. O Administrador consulta o painel com indicadores de ocupação, reservas por
   status e evolução diária de `NO_SHOW`.
2. Pode filtrar por período conforme os limites definidos na SPEC.
3. Pode exportar reservas em CSV ou PDF dentro do escopo administrativo.
4. A API valida autorização, filtros e volume máximo; a interface informa
   estados de carregamento, vazio, sucesso e erro.

**SPEC:** SPEC-017, SPEC-018.

## UC-06 — Consultar auditoria

**Ator:** Administrador<br>
**Pré-condições:** sessão autenticada.

O Administrador consulta registros de auditoria com filtros e paginação. Os
logs são somente de inserção pela aplicação; não há função para editá-los ou
excluí-los.

**SPEC:** SPEC-020.

## UC-07 — Consultar notificações

**Ator:** Administrador<br>
**Pré-condições:** sessão autenticada.

O Administrador pode consultar e marcar como lidas as próprias notificações. A
API não permite consultar ou alterar notificações de outra conta. Os eventos de
decisão de reserva e lembrete de check-in descritos na SPEC são destinados aos
usuários titulares das reservas.

**SPEC:** SPEC-019, SPEC-029.

## Recursos de interface

As preferências de tema e acessibilidade são compartilhadas pelos perfis
suportados. O fluxo de `/setup` é destinado somente a dados descartáveis de
desenvolvimento e não deve ser usado para provisionamento de produção.

**SPEC:** SPEC-014, SPEC-015.
