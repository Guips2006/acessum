# Caso de Uso — Professor

## Ator

**Professor**

## Objetivo

Permitir que o professor consulte os recursos disponíveis e gerencie as solicitações de reserva realizadas pelos alunos, podendo analisar, aprovar ou recusar solicitações de reserva.

---

# UC01 — Consultar Laboratórios e Equipamentos

## Objetivo

Permitir que o professor consulte os laboratórios e equipamentos cadastrados no sistema e suas respectivas situações.

## Pré-condições

- O professor deve estar autenticado no sistema.
- O professor deve possuir permissão para acessar os recursos.

## Fluxo Principal

1. O professor acessa a área de recursos.
2. O sistema apresenta os laboratórios e equipamentos cadastrados.
3. O sistema apresenta a situação de cada recurso.
4. O professor consulta as informações dos recursos.

## Fluxos Alternativos

### FA01 — Recurso indisponível

1. O sistema identifica que um recurso está indisponível.
2. O sistema apresenta a situação do recurso.
3. O professor pode consultar outro recurso.

## Pós-condições

- Os recursos cadastrados e suas respectivas situações são apresentados ao professor.

## Requisitos Relacionados

- RF-02 — Controle de perfis e permissões
- RF-03 — Consulta de laboratórios e equipamentos

---

# UC02 — Consultar Disponibilidade

## Objetivo

Permitir que o professor consulte os horários disponíveis e ocupados de um laboratório ou equipamento em determinado período.

## Pré-condições

- O professor deve estar autenticado.
- O recurso deve estar cadastrado no sistema.

## Fluxo Principal

1. O professor acessa a consulta de disponibilidade.
2. O professor seleciona um laboratório ou equipamento.
3. O professor informa o período desejado.
4. O sistema verifica as reservas existentes.
5. O sistema apresenta os horários disponíveis e ocupados.
6. O professor consulta a disponibilidade do recurso.

## Fluxos Alternativos

### FA01 — Recurso em manutenção

1. O professor seleciona um equipamento que está marcado como "Em manutenção".
2. O sistema informa que o equipamento está indisponível durante o período de manutenção.
3. O professor pode consultar outro recurso.

### FA02 — Nenhum horário disponível

1. O sistema identifica que não existem horários disponíveis para o período informado.
2. O sistema informa a indisponibilidade.
3. O professor pode realizar uma nova consulta.

## Pós-condições

- A disponibilidade do recurso é apresentada ao professor.
- Nenhuma reserva é criada ou alterada.

## Requisitos Relacionados

- RF-02 — Controle de perfis e permissões
- RF-03 — Consulta de laboratórios e equipamentos
- RF-04 — Consulta de disponibilidade
- RB-02 — Equipamento em manutenção

---

# UC03 — Analisar Solicitação de Reserva

## Objetivo

Permitir que o professor consulte e analise as solicitações de reserva realizadas pelos alunos.

## Pré-condições

- O professor deve estar autenticado.
- O professor deve possuir permissão para analisar solicitações.
- Deve existir pelo menos uma solicitação de reserva pendente.

## Fluxo Principal

1. O professor acessa a área de solicitações pendentes.
2. O sistema apresenta as solicitações que aguardam análise.
3. O professor seleciona uma solicitação.
4. O sistema apresenta as informações da solicitação.
5. O professor analisa o recurso, período e demais informações da solicitação.
6. O professor escolhe entre aprovar ou recusar a solicitação.

## Fluxos Alternativos

### FA01 — Nenhuma solicitação pendente

1. O professor acessa a área de solicitações.
2. O sistema verifica que não existem solicitações pendentes.
3. O sistema informa que não há solicitações aguardando análise.

### FA02 — Solicitação inválida

1. O professor identifica que a solicitação não pode ser aprovada devido a uma regra de negócio.
2. O sistema informa o motivo que impede a aprovação.
3. O professor recusa a solicitação.

## Pós-condições

- A solicitação é analisada pelo professor.
- A solicitação pode ser aprovada ou recusada.

## Requisitos Relacionados

- RF-02 — Controle de perfis e permissões
- RF-06 — Validação da solicitação
- RF-07 — Análise de solicitações
- RB-01 — Conflito de reservas
- RB-02 — Equipamento em manutenção
- RB-03 — Equipamento de uso controlado

---

# UC04 — Aprovar Solicitação de Reserva

## Objetivo

Permitir que o professor aprove uma solicitação de reserva válida realizada por um aluno.

## Pré-condições

- O professor deve estar autenticado.
- Deve existir uma solicitação de reserva pendente.
- A solicitação deve atender às regras de negócio.
- O recurso deve estar disponível para o período solicitado.

## Fluxo Principal

1. O professor acessa as solicitações pendentes.
2. O professor seleciona uma solicitação.
3. O sistema apresenta os dados da solicitação.
4. O sistema verifica as regras de negócio aplicáveis.
5. O professor seleciona a opção **Aprovar**.
6. O sistema altera o status da reserva para **Aprovada**.
7. O sistema registra a aprovação.

## Fluxos Alternativos

### FA01 — Conflito de reservas

1. O sistema identifica que existe uma reserva aprovada para o mesmo recurso em período conflitante.
2. O sistema impede a aprovação da solicitação.
3. O sistema informa o motivo ao professor.
4. A solicitação permanece sem aprovação.

### FA02 — Equipamento em manutenção

1. O sistema identifica que o equipamento está marcado como "Em manutenção".
2. O sistema impede a aprovação da reserva durante o período de indisponibilidade.
3. O sistema informa o motivo ao professor.

### FA03 — Equipamento de uso controlado

1. O sistema identifica que o equipamento é de uso controlado.
2. O sistema verifica a necessidade de aprovação do professor ou técnico responsável.
3. O professor responsável realiza a aprovação.
4. O sistema permite o prosseguimento da reserva.

## Pós-condições

- A solicitação passa para o status **Aprovada**, caso todas as regras sejam atendidas.
- A reserva aprovada passa a ocupar o período solicitado.

## Requisitos Relacionados

- RF-06 — Validação da solicitação
- RF-08 — Aprovação ou recusa de reserva
- RB-01 — Conflito de reservas
- RB-02 — Equipamento em manutenção
- RB-03 — Equipamento de uso controlado

---

# UC05 — Recusar Solicitação de Reserva

## Objetivo

Permitir que o professor recuse uma solicitação de reserva que não possa ser aprovada.

## Pré-condições

- O professor deve estar autenticado.
- Deve existir uma solicitação de reserva pendente.
- O professor deve possuir permissão para analisar solicitações.

## Fluxo Principal

1. O professor acessa as solicitações pendentes.
2. O professor seleciona uma solicitação.
3. O sistema apresenta os dados da solicitação.
4. O professor analisa a solicitação.
5. O professor seleciona a opção **Recusar**.
6. O sistema altera o status da reserva para **Recusada**.
7. O sistema registra a recusa.

## Fluxos Alternativos

### FA01 — Solicitação já processada

1. O professor seleciona uma solicitação que já foi aprovada ou recusada.
2. O sistema informa que a solicitação não está mais pendente.
3. O sistema impede uma nova decisão sobre a solicitação.

### FA02 — Conflito de reservas

1. O sistema identifica um conflito com uma reserva aprovada.
2. O sistema informa o conflito.
3. O professor recusa a solicitação.

## Pós-condições

- A solicitação passa para o status **Recusada**.
- O recurso permanece disponível para outras solicitações, caso não exista outra reserva para o período.

## Requisitos Relacionados

- RF-06 — Validação da solicitação
- RF-07 — Análise de solicitações
- RF-08 — Aprovação ou recusa de reserva
- RB-01 — Conflito de reservas

---

# Regras de Negócio Utilizadas

Os casos de uso do professor utilizam as regras de negócio já definidas em `requisitos.md`.

| Código | Regra de Negócio | Casos de Uso |
|---|---|---|
| RB-01 | Conflito de reservas | UC03, UC04, UC05 |
| RB-02 | Equipamento em manutenção | UC02, UC03, UC04 |
| RB-03 | Equipamento de uso controlado | UC03, UC04 |
| RB-04 | Limite de reservas | Não aplicável diretamente ao Professor |
| RB-05 | Cancelamento | Não aplicável diretamente ao Professor |
| RB-06 | Janela de check-in | Não aplicável diretamente ao Professor |
| RB-07 | No-show | Não aplicável diretamente ao Professor |

---

# Resumo dos Casos de Uso

| Código | Caso de Uso | Ator | RF Principal |
|---|---|---|---|
| UC01 | Consultar Laboratórios e Equipamentos | Professor | RF-03 |
| UC02 | Consultar Disponibilidade | Professor | RF-04 |
| UC03 | Analisar Solicitação de Reserva | Professor | RF-07 |
| UC04 | Aprovar Solicitação de Reserva | Professor | RF-08 |
| UC05 | Recusar Solicitação de Reserva | Professor | RF-08 |