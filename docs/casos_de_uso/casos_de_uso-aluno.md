# Casos de Uso — Aluno

Este documento apresenta os casos de uso disponíveis para o perfil Aluno no sistema Acessum.

---

## UC-01 — Autenticar-se

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno acesse o sistema utilizando suas credenciais.

### Pré-condições

- O aluno deve estar cadastrado no sistema.
- O aluno deve estar ativo.

### Fluxo principal

1. O aluno acessa a tela de login.
2. O aluno informa seu e-mail e senha.
3. O sistema valida as credenciais.
4. O sistema identifica o perfil do usuário.
5. O sistema permite o acesso às funcionalidades disponíveis para o aluno.

### Fluxos alternativos

- Caso o e-mail ou senha estejam incorretos, o sistema informa que as credenciais são inválidas.
- Caso o usuário esteja inativo, o sistema impede o acesso.

### Pós-condições

- O aluno está autenticado no sistema.

### Requisitos relacionados

- RF-01 — Autenticação
- RF-02 — Controle de perfis e permissões

---

## UC-02 — Consultar laboratórios

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno visualize os laboratórios cadastrados no sistema.

### Pré-condições

- O aluno deve estar autenticado.

### Fluxo principal

1. O aluno acessa a área de laboratórios.
2. O sistema consulta os laboratórios cadastrados.
3. O sistema apresenta os laboratórios e suas respectivas situações.
4. O aluno seleciona um laboratório para visualizar seus detalhes.

### Fluxos alternativos

- Caso não existam laboratórios cadastrados, o sistema informa que não existem recursos disponíveis.

### Pós-condições

- O aluno consegue visualizar as informações dos laboratórios.

### Requisitos relacionados

- RF-02 — Controle de perfis e permissões
- RF-03 — Consulta de laboratórios e equipamentos

---

## UC-03 — Consultar equipamentos

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno consulte os equipamentos disponíveis nos laboratórios.

### Pré-condições

- O aluno deve estar autenticado.
- Deve existir pelo menos um laboratório cadastrado.

### Fluxo principal

1. O aluno seleciona um laboratório.
2. O sistema apresenta os equipamentos associados ao laboratório.
3. O sistema informa a situação dos equipamentos.
4. O aluno consulta as informações do equipamento.

### Fluxos alternativos

- Caso o laboratório não possua equipamentos cadastrados, o sistema informa que não existem equipamentos disponíveis.
- Caso um equipamento esteja marcado como "Em manutenção", o sistema informa sua indisponibilidade.

### Pós-condições

- O aluno consegue consultar os equipamentos do laboratório e suas situações.

### Requisitos relacionados

- RF-02 — Controle de perfis e permissões
- RF-03 — Consulta de laboratórios e equipamentos
- RB-02 — Equipamento em manutenção

---

## UC-04 — Consultar disponibilidade

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno consulte os horários disponíveis e ocupados de um laboratório ou equipamento.

### Pré-condições

- O aluno deve estar autenticado.
- O recurso deve estar cadastrado no sistema.

### Fluxo principal

1. O aluno seleciona um laboratório ou equipamento.
2. O aluno informa a data e o período desejados.
3. O sistema consulta as reservas existentes.
4. O sistema verifica a situação do recurso.
5. O sistema verifica possíveis conflitos de reservas.
6. O sistema apresenta os horários disponíveis e ocupados.

### Fluxos alternativos

- Caso não existam horários disponíveis, o sistema informa a indisponibilidade.
- Caso o recurso esteja indisponível, o sistema informa sua situação.
- Caso o equipamento esteja em manutenção, o sistema informa que o equipamento não pode ser reservado durante o período de manutenção.

### Pós-condições

- O aluno conhece os horários disponíveis para realizar uma solicitação de reserva.

### Requisitos relacionados

- RF-04 — Consulta de disponibilidade
- RB-01 — Conflito de reservas
- RB-02 — Equipamento em manutenção

---

## UC-05 — Solicitar reserva

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno solicite a utilização de um laboratório ou equipamento em determinado período.

### Pré-condições

- O aluno deve estar autenticado.
- O recurso deve estar cadastrado.
- O período solicitado deve estar disponível.
- O aluno não pode ter atingido o limite de reservas futuras.
- O recurso não pode estar indisponível durante o período solicitado.

### Fluxo principal

1. O aluno consulta a disponibilidade do recurso.
2. O aluno seleciona o recurso.
3. O aluno informa a data e o horário desejados.
4. O sistema verifica a disponibilidade do recurso.
5. O sistema verifica se existe conflito com uma reserva aprovada.
6. O sistema verifica se o recurso está em manutenção.
7. O sistema verifica o limite de reservas futuras do aluno.
8. O sistema registra a solicitação de reserva.
9. O sistema associa a solicitação ao aluno e ao recurso.
10. O sistema informa que a solicitação foi registrada.

### Fluxos alternativos

#### FA01 — Conflito de reserva

1. O sistema identifica uma reserva aprovada para o mesmo recurso em período conflitante.
2. O sistema impede o registro da solicitação.
3. O sistema informa ao aluno que o período está indisponível.

#### FA02 — Equipamento em manutenção

1. O sistema identifica que o equipamento está marcado como "Em manutenção".
2. O sistema impede a solicitação para o período de indisponibilidade.
3. O sistema informa o motivo ao aluno.

#### FA03 — Limite de reservas atingido

1. O sistema identifica que o aluno atingiu o limite de reservas futuras.
2. O sistema impede uma nova solicitação.
3. O sistema informa que uma reserva existente deve ser concluída ou cancelada antes de uma nova solicitação.

#### FA04 — Equipamento de uso controlado

1. O sistema identifica que o equipamento é classificado como de uso controlado.
2. O sistema registra a solicitação, quando as demais regras forem atendidas.
3. O sistema encaminha a solicitação para aprovação de um professor ou técnico responsável.
4. O aluno aguarda a aprovação antes de utilizar o equipamento.

### Pós-condições

- Uma solicitação de reserva é registrada.
- A solicitação fica vinculada ao aluno e ao recurso.
- Caso o recurso seja de uso controlado, a utilização depende da aprovação de um professor ou técnico responsável.

### Requisitos relacionados

- RF-05 — Solicitação de reserva
- RF-06 — Validação da solicitação
- RB-01 — Conflito de reservas
- RB-02 — Equipamento em manutenção
- RB-03 — Equipamento de uso controlado
- RB-04 — Limite de reservas

---

## UC-06 — Consultar reservas

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno visualize suas reservas e seus respectivos status.

### Pré-condições

- O aluno deve estar autenticado.

### Fluxo principal

1. O aluno acessa a área de reservas.
2. O sistema busca as reservas associadas ao aluno.
3. O sistema apresenta as reservas.
4. O sistema informa o recurso, período e status de cada reserva.
5. O aluno pode selecionar uma reserva para visualizar seus detalhes.

### Fluxos alternativos

- Caso o aluno não possua reservas, o sistema informa que não existem reservas registradas.

### Pós-condições

- As reservas do aluno são apresentadas.

### Requisitos relacionados

- RF-10 — Histórico de reservas

---

## UC-07 — Cancelar reserva

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno cancele uma reserva dentro do prazo permitido.

### Pré-condições

- O aluno deve estar autenticado.
- O aluno deve possuir uma reserva.
- A reserva deve estar dentro do prazo permitido para cancelamento.

### Fluxo principal

1. O aluno acessa suas reservas.
2. O aluno seleciona a reserva que deseja cancelar.
3. O aluno solicita o cancelamento.
4. O sistema verifica se o cancelamento está dentro do prazo permitido.
5. O sistema altera o status da reserva para "Cancelada".
6. O sistema libera o período para novas reservas, conforme as regras do sistema.
7. O sistema informa ao aluno que a reserva foi cancelada.

### Fluxos alternativos

#### FA01 — Prazo de cancelamento expirado

1. O sistema identifica que a reserva está fora do prazo permitido para cancelamento.
2. O sistema impede o cancelamento.
3. O sistema informa ao aluno o motivo.

### Pós-condições

- A reserva é cancelada quando o cancelamento é permitido.
- O período reservado pode voltar a ficar disponível.

### Requisitos relacionados

- RB-05 — Cancelamento

---

## UC-08 — Realizar check-in

**Ator principal:** Aluno

**Objetivo:** Registrar o início da utilização do recurso reservado.

### Pré-condições

- O aluno deve estar autenticado.
- O aluno deve possuir uma reserva aprovada.
- A reserva deve estar dentro da janela permitida para check-in.

### Fluxo principal

1. O aluno acessa sua reserva aprovada.
2. O aluno solicita o check-in.
3. O sistema verifica a reserva.
4. O sistema verifica se o horário está dentro da janela permitida.
5. O sistema registra o início da utilização.
6. O sistema altera o status da reserva para "Em uso".

### Fluxos alternativos

#### FA01 — Check-in fora da janela permitida

1. O aluno solicita o check-in.
2. O sistema verifica que o horário está fora da janela permitida.
3. O sistema impede o check-in.
4. O sistema informa ao aluno que o check-in não pode ser realizado naquele momento.

#### FA02 — Reserva não aprovada

1. O aluno tenta realizar o check-in de uma reserva que não foi aprovada.
2. O sistema impede o check-in.
3. O sistema informa que a reserva não está aprovada.

#### FA03 — Reserva inexistente ou inválida

1. O sistema não encontra uma reserva válida associada ao aluno.
2. O sistema impede o check-in.
3. O sistema informa que não existe uma reserva válida para utilização.

### Pós-condições

- O início da utilização é registrado.
- A reserva passa para o estado "Em uso".

### Requisitos relacionados

- RF-09 — Check-in e encerramento
- RB-06 — Janela de check-in
- RB-07 — No-show

---

## UC-09 — Encerrar utilização

**Ator principal:** Aluno

**Objetivo:** Registrar o término da utilização do recurso reservado.

### Pré-condições

- O aluno deve estar autenticado.
- O aluno deve possuir uma reserva com status "Em uso".

### Fluxo principal

1. O aluno acessa a reserva em andamento.
2. O aluno solicita o encerramento da utilização.
3. O sistema registra a data e hora do encerramento.
4. O sistema altera o status da reserva para "Concluída".
5. O sistema registra o término da utilização.

### Fluxos alternativos

- Caso não exista uma reserva com status "Em uso", o sistema impede o encerramento da utilização.

### Pós-condições

- A utilização do recurso é encerrada.
- A reserva passa para o estado "Concluída".
- A reserva pode fazer parte do histórico do aluno.

### Requisitos relacionados

- RF-09 — Check-in e encerramento
- RF-10 — Histórico de reservas
- RB-04 — Limite de reservas

---

## UC-10 — Reportar problema

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno informe problemas encontrados em laboratórios ou equipamentos.

### Pré-condições

- O aluno deve estar autenticado.

### Fluxo principal

1. O aluno acessa a opção de reportar problema.
2. O aluno seleciona o laboratório relacionado ao problema.
3. O aluno pode selecionar o equipamento afetado.
4. O aluno descreve o problema.
5. O aluno envia o relato.
6. O sistema registra a ocorrência.
7. O sistema define o status do relato como "Aberto".

### Fluxos alternativos

- Caso o aluno não informe o laboratório ou recurso relacionado ao problema, o sistema solicita o preenchimento das informações necessárias.
- Caso a descrição do problema não seja informada, o sistema solicita que o aluno descreva a ocorrência.

### Pós-condições

- O problema é registrado no sistema e fica disponível para tratamento.

### Requisitos relacionados

- RF-03 — Consulta de laboratórios e equipamentos
- RF-02 — Controle de perfis e permissões

---

# Relação entre Casos de Uso e Regras de Negócio

As regras de negócio utilizadas pelos casos de uso do Aluno são as regras definidas em `requisitos.md`.

| Regra | Descrição | Casos de uso relacionados |
|---|---|---|
| RB-01 | Conflito de reservas | UC-04, UC-05 |
| RB-02 | Equipamento em manutenção | UC-03, UC-04, UC-05 |
| RB-03 | Equipamento de uso controlado | UC-05 |
| RB-04 | Limite de reservas | UC-05 |
| RB-05 | Cancelamento | UC-07 |
| RB-06 | Janela de check-in | UC-08 |
| RB-07 | No-show | UC-08 |

---

# Resumo das Funcionalidades do Aluno

| Código | Caso de Uso | Ator |
|---|---|---|
| UC-01 | Autenticar-se | Aluno |
| UC-02 | Consultar laboratórios | Aluno |
| UC-03 | Consultar equipamentos | Aluno |
| UC-04 | Consultar disponibilidade | Aluno |
| UC-05 | Solicitar reserva | Aluno |
| UC-06 | Consultar reservas | Aluno |
| UC-07 | Cancelar reserva | Aluno |
| UC-08 | Realizar check-in | Aluno |
| UC-09 | Encerrar utilização | Aluno |
| UC-10 | Reportar problema | Aluno |