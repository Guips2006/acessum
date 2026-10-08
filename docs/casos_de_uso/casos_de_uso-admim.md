# Caso de Uso — Administrador

## 1. Visão Geral

O **Administrador** é o usuário responsável pelo gerenciamento dos recursos e usuários do sistema **Acessum — Sistema de Gestão de Acessos e Usos de Laboratórios**.

O administrador possui permissões para gerenciar:

- Laboratórios;
- Equipamentos;
- Usuários.

Essas funcionalidades permitem manter os recursos do sistema atualizados e garantir que somente usuários cadastrados possam utilizar o sistema.

---

## 2. Ator

**Ator principal:** Administrador

O Administrador é responsável por manter os cadastros e os recursos disponíveis no sistema.

---

## 3. Casos de Uso do Administrador

O Administrador possui os seguintes casos de uso:

| Código | Caso de Uso | Descrição |
|---|---|---|
| UC01 | Adicionar Laboratório | Cadastrar um novo laboratório no sistema |
| UC02 | Excluir Laboratório | Remover um laboratório existente |
| UC03 | Cadastrar Equipamento | Adicionar um equipamento a um laboratório |
| UC04 | Remover Equipamento | Remover um equipamento cadastrado |
| UC05 | Cadastrar Usuário | Criar o cadastro de um novo usuário |
| UC06 | Remover Usuário | Remover um usuário do sistema |

---

## 4. UC01 — Adicionar Laboratório

### Objetivo

Permitir que o Administrador cadastre um novo laboratório no sistema.

### Ator

Administrador.

### Pré-condições

- O Administrador deve estar autenticado no sistema.
- O Administrador deve possuir permissão de gerenciamento.

### Fluxo Principal

1. O Administrador acessa a área de gerenciamento de laboratórios.
2. O sistema apresenta a opção **Adicionar Laboratório**.
3. O Administrador seleciona a opção.
4. O sistema apresenta o formulário de cadastro.
5. O Administrador informa os dados do laboratório.
6. O Administrador confirma o cadastro.
7. O sistema valida os dados informados.
8. O sistema cadastra o laboratório.
9. O sistema informa que o laboratório foi cadastrado com sucesso.

### Fluxos Alternativos

**A1 — Dados inválidos**

1. O sistema identifica que algum dado obrigatório está incorreto ou ausente.
2. O sistema informa o erro ao Administrador.
3. O Administrador corrige os dados.
4. O fluxo retorna para a confirmação do cadastro.

**A2 — Laboratório já cadastrado**

1. O sistema identifica que o laboratório já existe.
2. O sistema informa que não é possível realizar o cadastro duplicado.
3. O Administrador retorna ao formulário.

### Pós-condições

- O novo laboratório está cadastrado no sistema.
- O laboratório pode ser utilizado nas demais funcionalidades do sistema.

---

## 5. UC02 — Excluir Laboratório

### Objetivo

Permitir que o Administrador remova um laboratório do sistema.

### Ator

Administrador.

### Pré-condições

- O Administrador deve estar autenticado.
- O laboratório deve estar cadastrado.

### Fluxo Principal

1. O Administrador acessa a área de gerenciamento de laboratórios.
2. O sistema apresenta os laboratórios cadastrados.
3. O Administrador seleciona o laboratório desejado.
4. O Administrador seleciona a opção **Excluir**.
5. O sistema solicita a confirmação da exclusão.
6. O Administrador confirma.
7. O sistema remove o laboratório.
8. O sistema informa que a exclusão foi realizada com sucesso.

### Fluxos Alternativos

**A1 — Cancelamento**

1. O sistema solicita a confirmação.
2. O Administrador cancela a operação.
3. O sistema mantém o laboratório cadastrado.

**A2 — Laboratório possui utilização vinculada**

1. O sistema identifica que existem reservas ou dados relacionados ao laboratório.
2. O sistema informa que a exclusão não pode ser realizada diretamente.
3. O Administrador cancela a operação ou realiza os procedimentos necessários.

### Pós-condições

- O laboratório é removido do cadastro, caso não existam impedimentos.

---

## 6. UC03 — Cadastrar Equipamento

### Objetivo

Permitir que o Administrador cadastre equipamentos disponíveis nos laboratórios.

### Ator

Administrador.

### Pré-condições

- O Administrador deve estar autenticado.
- Deve existir um laboratório cadastrado.

### Fluxo Principal

1. O Administrador acessa o gerenciamento de equipamentos.
2. O sistema apresenta os equipamentos cadastrados.
3. O Administrador seleciona **Cadastrar Equipamento**.
4. O sistema apresenta o formulário.
5. O Administrador informa os dados do equipamento.
6. O Administrador seleciona o laboratório ao qual o equipamento pertence.
7. O Administrador confirma o cadastro.
8. O sistema valida os dados.
9. O sistema cadastra o equipamento.
10. O sistema informa o sucesso da operação.

### Fluxos Alternativos

**A1 — Dados inválidos**

1. O sistema identifica dados obrigatórios ausentes ou inválidos.
2. O sistema apresenta uma mensagem de erro.
3. O Administrador corrige as informações.
4. O fluxo retorna à confirmação.

### Pós-condições

- O equipamento está cadastrado.
- O equipamento está associado a um laboratório.

---

## 7. UC04 — Remover Equipamento

### Objetivo

Permitir que o Administrador remova um equipamento cadastrado.

### Ator

Administrador.

### Pré-condições

- O Administrador deve estar autenticado.
- O equipamento deve existir no sistema.

### Fluxo Principal

1. O Administrador acessa o gerenciamento de equipamentos.
2. O sistema apresenta os equipamentos cadastrados.
3. O Administrador seleciona um equipamento.
4. O Administrador seleciona **Remover Equipamento**.
5. O sistema solicita confirmação.
6. O Administrador confirma a remoção.
7. O sistema remove o equipamento.
8. O sistema apresenta uma mensagem de sucesso.

### Fluxos Alternativos

**A1 — Cancelamento**

1. O Administrador seleciona a opção de remoção.
2. O sistema solicita confirmação.
3. O Administrador cancela.
4. O equipamento permanece cadastrado.

### Pós-condições

- O equipamento deixa de estar disponível no cadastro do sistema.

---

## 8. UC05 — Cadastrar Usuário

### Objetivo

Permitir que o Administrador cadastre novos usuários no sistema.

### Ator

Administrador.

### Pré-condições

- O Administrador deve estar autenticado.
- O Administrador deve possuir permissão para gerenciar usuários.

### Fluxo Principal

1. O Administrador acessa o gerenciamento de usuários.
2. O sistema apresenta os usuários cadastrados.
3. O Administrador seleciona **Cadastrar Usuário**.
4. O sistema apresenta o formulário de cadastro.
5. O Administrador informa os dados do usuário.
6. O Administrador define o tipo de usuário.
7. O Administrador confirma o cadastro.
8. O sistema valida os dados.
9. O sistema cadastra o usuário.
10. O sistema informa que o usuário foi cadastrado com sucesso.

### Fluxos Alternativos

**A1 — Usuário já cadastrado**

1. O sistema verifica os dados informados.
2. O sistema identifica que o usuário já possui cadastro.
3. O sistema informa que não é possível realizar um cadastro duplicado.
4. O Administrador corrige os dados ou cancela a operação.

**A2 — Dados inválidos**

1. O sistema identifica informações inválidas.
2. O sistema apresenta uma mensagem de erro.
3. O Administrador corrige os dados.
4. O fluxo retorna à confirmação.

### Pós-condições

- O novo usuário está cadastrado.
- O usuário possui um perfil definido no sistema.

---

## 9. UC06 — Remover Usuário

### Objetivo

Permitir que o Administrador remova um usuário do sistema.

### Ator

Administrador.

### Pré-condições

- O Administrador deve estar autenticado.
- O usuário deve estar cadastrado.

### Fluxo Principal

1. O Administrador acessa o gerenciamento de usuários.
2. O sistema apresenta os usuários cadastrados.
3. O Administrador seleciona o usuário desejado.
4. O Administrador seleciona **Remover Usuário**.
5. O sistema solicita confirmação.
6. O Administrador confirma a remoção.
7. O sistema remove o usuário.
8. O sistema informa que a operação foi realizada com sucesso.

### Fluxos Alternativos

**A1 — Cancelamento**

1. O sistema solicita confirmação.
2. O Administrador cancela a operação.
3. O sistema mantém o usuário cadastrado.

**A2 — Usuário possui operações vinculadas**

1. O sistema verifica se existem reservas ou outras operações associadas ao usuário.
2. O sistema identifica vínculos ativos.
3. O sistema impede ou solicita tratamento dos vínculos antes da remoção.
4. O Administrador realiza o procedimento necessário.

### Pós-condições

- O usuário é removido ou desativado conforme as regras do sistema.
- O usuário não poderá realizar novas operações como usuário ativo.

---

## 10. Regras de Negócio

### RN01 — Autenticação

Somente usuários autenticados como **Administrador** podem acessar as funções administrativas.

### RN02 — Controle de Permissões

Usuários do tipo **Aluno** e **Professor** não possuem acesso às funcionalidades exclusivas do Administrador.

### RN03 — Cadastro de Laboratórios

Um laboratório não deve possuir cadastro duplicado.

### RN04 — Cadastro de Equipamentos

Todo equipamento cadastrado deve estar associado a um laboratório existente.

### RN05 — Cadastro de Usuários

Cada usuário deve possuir um cadastro único e um perfil definido.

### RN06 — Exclusão

Operações de exclusão devem solicitar confirmação antes de serem efetivadas.

### RN07 — Integridade dos Dados

O sistema deve impedir operações que causem inconsistência entre laboratórios, equipamentos, usuários e reservas existentes.
