# Casos de Uso — Aluno

Este documento apresenta os casos de uso disponíveis para o perfil **Aluno** no sistema Acessum.

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

---

## UC-02 — Consultar laboratórios

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno visualize os laboratórios cadastrados no sistema.

### Pré-condições

- O aluno deve estar autenticado.

### Fluxo principal

1. O aluno acessa a área de laboratórios.
2. O sistema consulta os laboratórios cadastrados.
3. O sistema apresenta os laboratórios disponíveis.
4. O aluno seleciona um laboratório para visualizar seus detalhes.

### Pós-condições

- O aluno consegue visualizar as informações dos laboratórios.

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

### Pós-condições

- O aluno consegue consultar os equipamentos do laboratório.

---

## UC-04 — Consultar disponibilidade

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno consulte os horários disponíveis para utilização de um laboratório.

### Pré-condições

- O aluno deve estar autenticado.
- O laboratório deve estar cadastrado.

### Fluxo principal

1. O aluno seleciona um laboratório.
2. O aluno informa a data e o período desejados.
3. O sistema consulta as reservas existentes.
4. O sistema verifica possíveis conflitos.
5. O sistema apresenta os horários disponíveis e ocupados.

### Fluxos alternativos

- Caso não existam horários disponíveis, o sistema informa a indisponibilidade.
- Caso o laboratório esteja indisponível, o sistema informa a situação.

### Pós-condições

- O aluno conhece os horários disponíveis para realizar uma reserva.

---

## UC-05 — Solicitar reserva de laboratório

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno solicite a utilização de um laboratório em determinado período.

### Pré-condições

- O aluno deve estar autenticado.
- O laboratório deve estar cadastrado.
- O período solicitado deve estar disponível.
- O aluno não pode ter atingido o limite de reservas futuras.

### Fluxo principal

1. O aluno consulta a disponibilidade do laboratório.
2. O aluno seleciona o laboratório.
3. O aluno informa a data e o horário desejados.
4. O sistema verifica a disponibilidade.
5. O sistema verifica as regras de negócio aplicáveis.
6. O sistema registra a solicitação.
7. O sistema associa a solicitação ao aluno e ao laboratório.
8. O sistema informa que a solicitação foi registrada.

### Fluxos alternativos

- Caso exista conflito de horário, o sistema rejeita a solicitação.
- Caso o aluno tenha atingido o limite de reservas futuras, o sistema impede uma nova solicitação.
- Caso o período não esteja disponível, o sistema solicita que o aluno escolha outro horário.

### Pós-condições

- Uma solicitação de reserva é registrada.

---

## UC-06 — Consultar reservas

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno visualize suas reservas.

### Pré-condições

- O aluno deve estar autenticado.

### Fluxo principal

1. O aluno acessa a área de reservas.
2. O sistema busca as reservas associadas ao aluno.
3. O sistema apresenta as reservas.
4. O sistema informa o laboratório, período e status de cada reserva.
5. O aluno pode selecionar uma reserva para visualizar seus detalhes.

### Pós-condições

- As reservas do aluno são apresentadas.

---

## UC-07 — Cancelar reserva

**Ator principal:** Aluno

**Objetivo:** Permitir que o aluno cancele uma reserva.

### Pré-condições

- O aluno deve estar autenticado.
- O aluno deve possuir uma reserva.
- A reserva deve estar dentro do prazo permitido para cancelamento.

### Fluxo principal

1. O aluno acessa suas reservas.
2. O aluno seleciona a reserva que deseja cancelar.
3. O aluno solicita o cancelamento.
4. O sistema verifica se o cancelamento é permitido.
5. O sistema altera o status da reserva para cancelada.
6. O sistema libera o período para novas reservas.

### Fluxos alternativos

- Caso o prazo de cancelamento tenha expirado, o sistema impede o cancelamento e informa o motivo.

### Pós-condições

- A reserva é cancelada.
- O período reservado pode voltar a ficar disponível.

---

## UC-08 — Realizar check-in

**Ator principal:** Aluno

**Objetivo:** Registrar o início da utilização do laboratório.

### Pré-condições

- O aluno deve estar autenticado.
- O aluno deve possuir uma reserva aprovada.
- A reserva deve estar dentro da janela permitida para check-in.

### Fluxo principal

1. O aluno acessa sua reserva.
2. O aluno solicita o check-in.
3. O sistema verifica a reserva.
4. O sistema verifica se o horário permite o check-in.
5. O sistema registra o início da utilização.
6. O sistema altera o status da reserva para `EM_USO`.

### Fluxos alternativos

- Caso o horário esteja fora da janela permitida, o sistema impede o check-in.
- Caso a reserva não esteja aprovada, o sistema impede o início da utilização.
- Caso não exista uma reserva válida, o sistema impede o check-in.

### Pós-condições

- O início da utilização é registrado.
- A reserva passa para o estado `EM_USO`.

---

## UC-09 — Encerrar utilização

**Ator principal:** Aluno

**Objetivo:** Registrar o término da utilização do laboratório.

### Pré-condições

- O aluno deve estar autenticado.
- O aluno deve possuir uma reserva com status `EM_USO`.

### Fluxo principal

1. O aluno acessa a reserva em andamento.
2. O aluno solicita o encerramento da utilização.
3. O sistema registra a data e hora do encerramento.
4. O sistema altera o status da reserva para `ENCERRADA`.
5. O sistema registra o término da utilização.

### Pós-condições

- A utilização do laboratório é encerrada.
- A reserva passa a fazer parte do histórico.

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
7. O sistema define o status do relato como `ABERTO`.

### Pós-condições

- O problema é registrado no sistema e fica disponível para tratamento.

---

# Regras Gerais do Sistema

As regras abaixo são aplicadas às funcionalidades utilizadas pelo aluno.

## RG-01 — Usuário deve estar autenticado

Para utilizar funcionalidades que dependem da identificação do usuário, o aluno deve estar autenticado no sistema.

Um usuário não autenticado não pode realizar operações como:

- solicitar uma reserva;
- cancelar uma reserva;
- realizar check-in;
- encerrar uma utilização;
- consultar suas reservas;
- reportar problemas.

---

## RG-02 — Usuário deve estar ativo

Somente usuários com status `ATIVO` podem acessar e utilizar as funcionalidades do sistema.

Caso um aluno seja desativado, ele não poderá realizar novas operações até que sua conta seja reativada.

---

## RG-03 — Não pode existir conflito de reservas

O sistema não deve permitir que duas reservas ocupem o mesmo laboratório no mesmo período.

Antes de registrar uma reserva, o sistema deve verificar as reservas existentes para o laboratório e o horário solicitado.

---

## RG-04 — Limite de reservas futuras

O aluno não pode possuir uma quantidade de reservas futuras superior ao limite definido pelas regras de negócio do sistema.

Caso o limite seja atingido, o sistema deve impedir novas solicitações de reserva.

---

## RG-05 — Cancelamento dentro do prazo

O aluno somente pode cancelar uma reserva dentro do prazo definido pelo sistema.

Após o prazo, o sistema deve impedir o cancelamento.

---

## RG-06 — Check-in dentro da janela permitida

O aluno somente pode realizar o check-in dentro da janela de tempo definida para a reserva.

Caso o aluno tente realizar o check-in fora dessa janela, o sistema deve impedir a operação.

---

## RG-07 — No-show

Caso o aluno possua uma reserva, mas não realize o check-in dentro da janela permitida, o sistema pode registrar a ocorrência como `NO_SHOW`.

Essa ocorrência pode ser utilizada posteriormente para controle do histórico de utilização do aluno.

---

## RG-08 — Equipamento indisponível

Equipamentos que estejam indisponíveis, em manutenção ou em situação que impeça sua utilização não devem ser considerados disponíveis para reserva.

---

## RG-09 — Registro das operações

As operações realizadas pelo aluno devem ser registradas pelo sistema quando necessário, permitindo manter o histórico de reservas e utilizações.

---

# Resumo das funcionalidades do Aluno

| Funcionalidade | Aluno |
|---|:---:|
| Autenticar-se | ✅ |
| Consultar laboratórios | ✅ |
| Consultar equipamentos | ✅ |
| Consultar disponibilidade | ✅ |
| Solicitar reserva | ✅ |
| Consultar reservas | ✅ |
| Cancelar reserva | ✅ |
| Realizar check-in | ✅ |
| Encerrar utilização | ✅ |
| Reportar problema | ✅ |
| Cadastrar laboratório | ❌ |
| Cadastrar equipamento | ❌ |
| Gerenciar usuários | ❌ |
| Aprovar reservas | ❌ |
