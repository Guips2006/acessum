<div align="center">

# 📋 Requisitos do Sistema

### Sistema de Gestão de Acesso e Uso de Laboratórios

<br>

<table>
<tr>
<td align="center" width="33%">

### 🔵 RF
**10**

Requisitos Funcionais

</td>

<td align="center" width="33%">

### 🟣 RNF
**5**

Requisitos Não Funcionais

</td>

<td align="center" width="33%">

### 🟠 RB
**7**

Regras de Negócio

</td>
</tr>
</table>

</div>

---

# 🔵 Requisitos Funcionais

> Definem **o que o sistema deve fazer**.

---

## RF-01 — Autenticação

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** o usuário informar credenciais válidas, **THE SYSTEM SHALL**
> iniciar uma sessão autenticada para o usuário.

> **IF** as credenciais informadas forem inválidas, **THEN THE SYSTEM SHALL**
> negar o acesso e informar que as credenciais são inválidas.

---

## RF-02 — Controle de perfis e permissões

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Unwanted behavior**

> **IF** um usuário tentar acessar uma funcionalidade não permitida para seu
> perfil, **THEN THE SYSTEM SHALL** negar o acesso à funcionalidade.

**Perfis previstos:**

| Perfil | Responsabilidade |
|:---|:---|
| 🎓 **Aluno** | Consultar recursos e solicitar reservas |
| 👩‍🏫 **Professor/Técnico** | Gerenciar solicitações e recursos |
| ⚙️ **Administrador** | Gerenciar usuários e configurações do sistema |

---

## RF-03 — Consulta de laboratórios e equipamentos

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** o usuário acessar a área de recursos, **THE SYSTEM SHALL** exibir
> os laboratórios e equipamentos cadastrados e suas respectivas situações.

---

## RF-04 — Consulta de disponibilidade

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** o usuário selecionar um recurso e um período, **THE SYSTEM SHALL**
> apresentar os horários disponíveis e ocupados para o recurso selecionado.

---

## RF-05 — Solicitação de reserva

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** um aluno selecionar um recurso e informar um período disponível,
> **THE SYSTEM SHALL** registrar uma solicitação de reserva vinculada ao
> usuário e ao recurso selecionado.

---

## RF-06 — Validação da solicitação

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Unwanted behavior**

> **IF** uma solicitação de reserva violar alguma regra de negócio, **THEN THE
> SYSTEM SHALL** impedir o registro da solicitação e informar o motivo ao
> usuário.

---

## RF-07 — Análise de solicitações

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** um professor ou técnico acessar as solicitações pendentes,
> **THE SYSTEM SHALL** apresentar as reservas que aguardam análise.

---

## RF-08 — Aprovação ou recusa de reserva

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** um professor ou técnico aprovar uma solicitação, **THE SYSTEM
> SHALL** alterar o status da reserva para "Aprovada".

> **WHEN** um professor ou técnico recusar uma solicitação, **THE SYSTEM
> SHALL** alterar o status da reserva para "Recusada".

---

## RF-09 — Check-in e encerramento

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🟡 Média</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** um aluno realizar o check-in de uma reserva aprovada dentro do
> período permitido, **THE SYSTEM SHALL** registrar o início da utilização.

> **WHEN** o aluno finalizar a utilização do recurso, **THE SYSTEM SHALL**
> registrar o encerramento e atualizar o status da reserva para "Concluída".

---

## RF-10 — Histórico de reservas

<table>
<tr>
<td width="180"><b>Tipo</b></td>
<td>Requisito Funcional</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🟡 Média</td>
</tr>
</table>

**EARS — Event-driven**

> **WHEN** um usuário consultar seu histórico, **THE SYSTEM SHALL** apresentar
> as reservas realizadas pelo usuário, incluindo seus respectivos status,
> recursos e períodos de utilização.

---

# 🟣 Requisitos Não Funcionais

> Definem **como o sistema deve se comportar**.

Os RNFs abaixo possuem condições verificáveis, conforme a orientação da
disciplina sobre requisitos não funcionais mensuráveis. :contentReference[oaicite:2]{index=2}

---

## RNF-01 — Desempenho

<table>
<tr>
<td width="180"><b>Categoria</b></td>
<td>Desempenho</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Ubiquitous**

> **THE SYSTEM SHALL** responder a 95% das requisições das operações
> principais em menos de **2 segundos (P95)**.

---

## RNF-02 — Segurança de acesso

<table>
<tr>
<td width="180"><b>Categoria</b></td>
<td>Segurança</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Ubiquitous**

> **THE SYSTEM SHALL** exigir autenticação para acessar funcionalidades
> protegidas do sistema.

---

## RNF-03 — Proteção de credenciais

<table>
<tr>
<td width="180"><b>Categoria</b></td>
<td>Segurança</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🔴 Alta</td>
</tr>
</table>

**EARS — Ubiquitous**

> **THE SYSTEM SHALL** armazenar senhas utilizando mecanismo de hash,
> impedindo o armazenamento da senha original em texto puro.

---

## RNF-04 — Usabilidade

<table>
<tr>
<td width="180"><b>Categoria</b></td>
<td>Usabilidade</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🟡 Média</td>
</tr>
</table>

**EARS — Ubiquitous**

> **THE SYSTEM SHOULD** apresentar uma interface responsiva e consistente,
> permitindo que as principais ações do sistema sejam realizadas de forma
> clara e sem etapas desnecessárias.

---

## RNF-05 — Documentação da API

<table>
<tr>
<td width="180"><b>Categoria</b></td>
<td>Documentação</td>
</tr>
<tr>
<td><b>Prioridade</b></td>
<td>🟡 Média</td>
</tr>
</table>

**EARS — Ubiquitous**

> **THE SYSTEM SHALL** disponibilizar documentação dos endpoints da API por
> meio do padrão OpenAPI/Swagger.

---

# 🟠 Regras de Negócio

> Definem **políticas e restrições específicas do domínio**.

As regras de negócio devem permanecer separadas dos detalhes puramente
técnicos e devem orientar os testes do sistema. :contentReference[oaicite:3]{index=3}

---

## RB-01 — Conflito de reservas

> **IF** um recurso possuir uma reserva aprovada para determinado período,
> **THEN THE SYSTEM SHALL** impedir outra reserva aprovada para o mesmo recurso
> durante período conflitante.

---

## RB-02 — Equipamento em manutenção

> **IF** um equipamento estiver marcado como "Em manutenção", **THEN THE
> SYSTEM SHALL** impedir novas reservas para o período em que o equipamento
> estiver indisponível.

---

## RB-03 — Equipamento de uso controlado

> **IF** um equipamento estiver classificado como de uso controlado, **THEN
> THE SYSTEM SHALL** exigir aprovação de um professor ou técnico responsável
> antes da utilização.

---

## RB-04 — Limite de reservas

> **IF** o aluno atingir o limite de reservas futuras definido pelo sistema,
> **THEN THE SYSTEM SHALL** impedir novas solicitações até que uma reserva
> existente seja concluída ou cancelada.

---

## RB-05 — Cancelamento

> **IF** o usuário tentar cancelar uma reserva fora do prazo permitido,
> **THEN THE SYSTEM SHALL** impedir o cancelamento.

---

## RB-06 — Janela de check-in

> **IF** o usuário tentar realizar o check-in fora da janela permitida para
> sua reserva, **THEN THE SYSTEM SHALL** impedir o check-in.

---

## RB-07 — No-show

> **IF** o aluno não realizar o check-in dentro da janela permitida e não
> cancelar a reserva previamente, **THEN THE SYSTEM SHALL** registrar a
> ocorrência como "No-show".

---

# 🔗 Relação entre os requisitos

<table>
<tr>
<th>Tipo</th>
<th>Quantidade</th>
<th>Função</th>
</tr>

<tr>
<td>🔵 <b>RF</b></td>
<td align="center">10</td>
<td>Define as funcionalidades que o sistema deve executar.</td>
</tr>

<tr>
<td>🟣 <b>RNF</b></td>
<td align="center">5</td>
<td>Define características de qualidade e condições de funcionamento.</td>
</tr>

<tr>
<td>🟠 <b>RB</b></td>
<td align="center">7</td>
<td>Define as políticas e restrições do domínio.</td>
</tr>

</table>