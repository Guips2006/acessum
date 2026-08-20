<div align="center">

# 🧪 Sistema de Gestão de Acesso e Uso de Laboratórios

### Documento de Visão do Produto

<br>

**Projeto — Engenharia de Computação**

<br>

`Semana 2` · `Visão do Produto`

</div>

---

<table>
<tr>
<td width="50%" align="center">

### 🎯 PROBLEMA

Dificuldade em controlar reservas,
disponibilidade e utilização de
laboratórios e equipamentos.

</td>

<td width="50%" align="center">

### 💡 SOLUÇÃO

Sistema centralizado para consulta,
solicitação, aprovação e acompanhamento
do uso dos recursos.

</td>
</tr>
</table>

---

# 📌 1. Visão Geral

<table>
<tr>
<th width="180">Aspecto</th>
<th>Descrição</th>
</tr>

<tr>
<td><b>Problema</b></td>
<td>Dificuldade em controlar reservas, disponibilidade e utilização de laboratórios e equipamentos.</td>
</tr>

<tr>
<td><b>Solução</b></td>
<td>Sistema centralizado para consulta, solicitação, aprovação e acompanhamento do uso dos recursos.</td>
</tr>

<tr>
<td><b>Público-alvo</b></td>
<td>Alunos, professores/técnicos e administradores.</td>
</tr>

<tr>
<td><b>Objetivo</b></td>
<td>Organizar o uso dos recursos e reduzir conflitos de horários e informações descentralizadas.</td>
</tr>

<tr>
<td><b>MVP</b></td>
<td>Reservas, aprovação, disponibilidade, check-in, encerramento, manutenção e histórico.</td>
</tr>

</table>

---

# 🔎 2. Contexto

A utilização de laboratórios e equipamentos acadêmicos envolve diferentes
usuários, horários, permissões e condições de uso.

Quando o controle dessas informações é realizado por planilhas, mensagens ou
outros processos descentralizados, torna-se mais difícil acompanhar as
solicitações, verificar a disponibilidade dos recursos e evitar conflitos de
horário.

<table>
<tr>
<th width="25%">Situação</th>
<th width="35%">Problema</th>
<th width="40%">Impacto</th>
</tr>

<tr>
<td>📊 Planilhas</td>
<td>Informações descentralizadas</td>
<td>Dificuldade para manter os dados atualizados</td>
</tr>

<tr>
<td>💬 Mensagens</td>
<td>Solicitações em diferentes canais</td>
<td>Perda de informações e dificuldade de acompanhamento</td>
</tr>

<tr>
<td>📅 Controle manual</td>
<td>Verificação de horários</td>
<td>Possibilidade de conflitos entre reservas</td>
</tr>

<tr>
<td>🔧 Manutenção</td>
<td>Equipamentos indisponíveis</td>
<td>Possibilidade de solicitações indevidas</td>
</tr>

</table>

---

# 🚨 3. Problema

> **Como centralizar o processo de utilização dos laboratórios e equipamentos,
> permitindo controlar disponibilidade, reservas, aprovações e histórico?**

### Principais problemas identificados

| Problema | Consequência |
|:---|:---|
| Informações espalhadas em diferentes canais | Dificuldade para localizar informações atualizadas |
| Controle manual de horários | Possibilidade de conflitos entre reservas |
| Falta de acompanhamento das solicitações | Usuário não sabe se sua solicitação foi aprovada |
| Equipamentos indisponíveis | Possibilidade de solicitar recursos em manutenção |
| Falta de histórico centralizado | Dificuldade para consultar utilizações anteriores |

---

# 💡 4. Solução Proposta

O projeto propõe um sistema para centralizar o gerenciamento de laboratórios
e equipamentos acadêmicos.

<table>
<tr>
<td align="center">🔐<br><b>Autenticar</b></td>
<td align="center">🔎<br><b>Consultar</b></td>
<td align="center">📅<br><b>Reservar</b></td>
<td align="center">✅<br><b>Aprovar</b></td>
<td align="center">🟢<br><b>Utilizar</b></td>
<td align="center">📚<br><b>Registrar</b></td>
</tr>
</table>

### Funcionalidades principais

| Funcionalidade | Descrição |
|:---|:---|
| 🔐 **Autenticação** | Controle de acesso dos usuários |
| 👥 **Perfis** | Controle das permissões de cada tipo de usuário |
| 🔎 **Recursos** | Consulta de laboratórios e equipamentos |
| 📅 **Disponibilidade** | Visualização dos horários disponíveis |
| 📝 **Reservas** | Solicitação de utilização |
| ✅ **Aprovação** | Análise das solicitações |
| 🟢 **Check-in** | Registro do início da utilização |
| 🔴 **Encerramento** | Registro do término da utilização |
| 🔧 **Manutenção** | Bloqueio de equipamentos indisponíveis |
| 📚 **Histórico** | Registro das utilizações realizadas |

---

# 🎯 5. Objetivo

O objetivo do sistema é tornar o processo de utilização dos recursos
acadêmicos mais organizado, rastreável e controlado, reduzindo conflitos
de horário e facilitando o gerenciamento dos laboratórios.

### Objetivos específicos

<table>
<tr>
<th>Objetivo</th>
<th>Resultado esperado</th>
</tr>

<tr>
<td>🎯 Centralizar informações</td>
<td>Usuários encontram os dados em um único sistema.</td>
</tr>

<tr>
<td>📅 Organizar reservas</td>
<td>Redução de conflitos de horário.</td>
</tr>

<tr>
<td>✅ Controlar aprovações</td>
<td>Responsáveis conseguem analisar solicitações.</td>
</tr>

<tr>
<td>🔧 Controlar equipamentos</td>
<td>Recursos em manutenção não podem ser reservados.</td>
</tr>

<tr>
<td>📚 Registrar utilização</td>
<td>O sistema mantém histórico das reservas.</td>
</tr>

<tr>
<td>👁️ Facilitar acompanhamento</td>
<td>Alunos conseguem consultar o status de suas solicitações.</td>
</tr>

</table>

---

# 👥 6. Público-alvo

<table>
<tr>
<th width="25%">Público</th>
<th width="25%">Papel</th>
<th>Necessidade principal</th>
</tr>

<tr>
<td>🎓 <b>Alunos</b></td>
<td>Solicitantes</td>
<td>Consultar disponibilidade e solicitar utilização de recursos.</td>
</tr>

<tr>
<td>👩‍🏫 <b>Professores/Técnicos</b></td>
<td>Responsáveis</td>
<td>Analisar solicitações e controlar laboratórios e equipamentos.</td>
</tr>

<tr>
<td>⚙️ <b>Administradores</b></td>
<td>Gestores</td>
<td>Gerenciar usuários e recursos do sistema.</td>
</tr>

</table>

---

# 📦 7. Escopo do MVP

## ✅ Dentro do escopo

<table>
<tr>
<th>Funcionalidade</th>
<th width="100">Status</th>
</tr>

<tr><td>Autenticação de usuários</td><td align="center">🟢</td></tr>
<tr><td>Controle de perfis de acesso</td><td align="center">🟢</td></tr>
<tr><td>Cadastro de laboratórios</td><td align="center">🟢</td></tr>
<tr><td>Cadastro de equipamentos</td><td align="center">🟢</td></tr>
<tr><td>Consulta de recursos</td><td align="center">🟢</td></tr>
<tr><td>Consulta de disponibilidade</td><td align="center">🟢</td></tr>
<tr><td>Solicitação de reserva</td><td align="center">🟢</td></tr>
<tr><td>Aprovação ou recusa</td><td align="center">🟢</td></tr>
<tr><td>Consulta do status da reserva</td><td align="center">🟢</td></tr>
<tr><td>Check-in</td><td align="center">🟢</td></tr>
<tr><td>Encerramento da utilização</td><td align="center">🟢</td></tr>
<tr><td>Histórico de utilização</td><td align="center">🟢</td></tr>
<tr><td>Bloqueio para manutenção</td><td align="center">🟢</td></tr>

</table>

---

## ❌ Fora do escopo inicial

<table>
<tr>
<th>Funcionalidade</th>
<th>Motivo</th>
</tr>

<tr>
<td>📱 Aplicativo mobile</td>
<td>Não é necessário para validar o MVP.</td>
</tr>

<tr>
<td>💬 Integração com WhatsApp</td>
<td>Integração externa fora do escopo inicial.</td>
</tr>

<tr>
<td>📅 Google Calendar</td>
<td>Não é necessária para o funcionamento do MVP.</td>
</tr>

<tr>
<td>💳 Pagamentos</td>
<td>Não faz parte do problema identificado.</td>
</tr>

<tr>
<td>👁️ Reconhecimento facial</td>
<td>Complexidade desnecessária para o MVP.</td>
</tr>

<tr>
<td>🤖 IoT</td>
<td>Não é necessário para validar a solução.</td>
</tr>

</table>

---

# 🔄 8. Fluxo Principal

```text
                    ┌─────────────────┐
                    │      ALUNO      │
                    └────────┬────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Consulta o recurso │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Verifica            │
                  │ disponibilidade     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Solicita reserva    │
                  └──────────┬──────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Professor/Técnico analisa│
                │ a solicitação             │
                └────────────┬─────────────┘
                             │
                      ┌──────┴──────┐
                      │             │
                      ▼             ▼
                 ┌─────────┐   ┌─────────┐
                 │ Aprovada│   │ Recusada│
                 └────┬────┘   └─────────┘
                      │
                      ▼
                 ┌─────────┐
                 │Check-in │
                 └────┬────┘
                      │
                      ▼
                 ┌─────────┐
                 │ Utiliza │
                 └────┬────┘
                      │
                      ▼
               ┌─────────────┐
               │ Encerramento│
               └──────┬──────┘
                      │
                      ▼
                 📚 Histórico