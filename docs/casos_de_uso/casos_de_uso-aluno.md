# Casos de Uso — Aluno

Este documento resume os fluxos do perfil Aluno. Os endpoints, contratos de
dados, regras de autorização e componentes estão descritos nas SPECs individuais
referenciadas no [mapa de SPECs](../mapa_de_specs.md).

## UC-01 — Entrar no sistema

**Ator:** Aluno<br>
**Pré-condições:** conta cadastrada e ativa.

1. O Aluno informa e-mail e senha.
2. O sistema valida as credenciais e inicia a sessão.
3. O sistema apresenta as funcionalidades permitidas ao perfil.

Credenciais inválidas ou conta inativa impedem o acesso. A conta suspensa por
`NO_SHOW` ainda pode autenticar e consultar funções permitidas, mas não pode
solicitar reservas.

**SPEC:** SPEC-001, SPEC-016.

## UC-02 — Consultar laboratórios e equipamentos

**Ator:** Aluno<br>
**Pré-condições:** sessão autenticada.

1. O Aluno consulta os laboratórios.
2. O sistema apresenta os laboratórios ativos e os equipamentos associados,
   identificando seus status `ATIVO` ou `INATIVO`.
3. O Aluno pode consultar os detalhes dos recursos.

Equipamentos são apenas consultáveis: não há reserva individual nem status de
manutenção no domínio atual.

**SPEC:** SPEC-005.

## UC-03 — Consultar disponibilidade semanal

**Ator:** Aluno<br>
**Pré-condições:** sessão autenticada e laboratório ativo.

1. O Aluno informa uma data e consulta a grade semanal do laboratório.
2. O sistema apresenta os períodos ocupados e livres conforme as reservas
   aprovadas ou em uso.
3. O Aluno pode navegar entre semanas e abrir o fluxo de solicitação.

**SPEC:** SPEC-006, SPEC-028.

## UC-04 — Solicitar reserva de laboratório

**Ator:** Aluno<br>
**Pré-condições:** sessão autenticada, laboratório ativo, período válido e conta
sem suspensão vigente.

1. O Aluno seleciona laboratório, período e finalidade.
2. Opcionalmente, adiciona outros usuários ativos como co-reservantes.
3. O sistema valida o período e registra a reserva como `PENDENTE`.
4. O Professor analisa a solicitação.

Reservas em conflito são impedidas. O limite numérico de reservas futuras não
está implementado (OPEN-04).

**SPEC:** SPEC-007, SPEC-008, SPEC-029.

## UC-05 — Consultar e cancelar reservas

**Ator:** Aluno titular ou co-reservante<br>
**Pré-condições:** sessão autenticada.

1. O Aluno consulta suas reservas e os respectivos status.
2. O titular pode cancelar uma reserva `PENDENTE` ou `APROVADA` até uma hora
   antes do início.
3. O sistema atualiza a reserva para `CANCELADA` e libera o período.

O histórico pode ser acessado pelo titular e pelos co-reservantes conforme os
filtros da API; o cancelamento é permitido somente ao titular.

**SPEC:** SPEC-009, SPEC-012, SPEC-029.

## UC-06 — Fazer check-in e encerrar a utilização

**Ator:** Aluno titular da reserva<br>
**Pré-condições:** reserva `APROVADA` e sessão autenticada.

1. Entre 15 minutos antes e 15 minutos depois do início, o Aluno faz check-in.
2. O sistema altera o status para `EM_USO`.
3. Ao terminar, o Aluno encerra a utilização e o sistema altera o status para
   `CONCLUIDA`.

Se o check-in não ocorrer dentro da janela, a reserva passa para `NO_SHOW`.

**SPEC:** SPEC-010, SPEC-011, SPEC-016.

## UC-07 — Reportar problema

**Ator:** Aluno<br>
**Pré-condições:** sessão autenticada.

1. O Aluno seleciona o laboratório, informa a descrição e envia o relato.
2. O sistema registra o relato como `ABERTO`.
3. O Administrador pode consultar o relato e alterar seu status para
   `RESOLVIDO`.

**SPEC:** SPEC-013.

## UC-08 — Favoritar laboratório

**Ator:** Aluno<br>
**Pré-condições:** sessão autenticada e laboratório disponível.

1. O Aluno marca ou desmarca um laboratório como favorito.
2. O sistema persiste a preferência individual.
3. O Aluno pode filtrar a lista pelos laboratórios favoritos e iniciar uma
   solicitação com um favorito pré-selecionado.

**SPEC:** SPEC-027.

## UC-09 — Consultar dados e perfil

**Ator:** Aluno<br>
**Pré-condições:** sessão autenticada.

O Aluno pode consultar e atualizar os dados de perfil permitidos, incluindo
CPF, RG, data de nascimento e avatar, consultar a atividade registrada e
alterar a própria senha. A criação de usuários e a redefinição assistida de
senha são funções administrativas; a troca de senha temporária é obrigatória
no próximo acesso.

**SPEC:** SPEC-015, SPEC-022, SPEC-023.

## Recursos de interface

As preferências de tema e acessibilidade, inclusive modo escuro e alto
contraste, são mantidas no navegador e estão disponíveis aos perfis suportados.
O dashboard do Aluno também oferece acesso rápido às reservas elegíveis para
check-in e exibe a contagem de faltas e o status da conta. Não há pontuação
numérica de confiança calculada no código atual.

**SPEC:** SPEC-014, SPEC-025, SPEC-026.
