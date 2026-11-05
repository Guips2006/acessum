# SPEC-022: Perfil Completo e Troca de Senha

**Status:** CONCLUÍDO<br>
**Objetivo:** Completar o perfil pessoal e permitir troca segura da senha.

## Requisitos

- O e-mail é apresentado como texto somente leitura e não é aceito como campo de alteração pelo endpoint de perfil.
- O titular pode completar nome, CPF, RG e data de nascimento de contas legadas e manter/atualizar seu avatar.
- O titular pode cadastrar ou alterar o PIN pessoal de segurança com exatamente seis dígitos. O PIN é confirmado na interface e persistido exclusivamente como hash bcrypt; sua alteração é autenticada e auditada.
- Se já houver PIN cadastrado, a alteração exige o PIN atual. Contas legadas sem PIN podem cadastrá-lo sem informar um PIN anterior.
- O seletor nativo de arquivo fica visualmente oculto e acionável por controle acessível com ícone.
- A troca exige a senha atual, senha nova com pelo menos 12 caracteres e letras e números, e confirmação no frontend.
- Senha temporária só libera acesso a `/api/auth/me`, perfil e troca de senha; demais rotas permanecem bloqueadas até a troca.
- A rota autenticada de PIN permanece acessível durante a troca obrigatória da senha, sem liberar as demais rotas protegidas.

## Persistência e compatibilidade

- Novos campos em `usuarios` usam migração aditiva.
- Registros legados mantêm `NULL` nos dados ausentes até o titular completá-los; nenhum CPF/RG/data é fabricado.

## Validação

- Confirmar e-mail imutável no cliente e API, perfil de titularidade, senha atual incorreta, divergência de confirmação e desbloqueio após troca.

**Contratos e interface:** `POST /api/auth/alterar-senha` recebe `AlterarSenha`; `PATCH /api/perfil/me` recebe multipart e retorna `PerfilUsuarioResponse`; `PUT /api/perfil/pin` recebe PIN novo e confirmação (mais PIN atual quando já configurado). A resposta do perfil informa apenas `pin_configurado`, nunca o hash. Interface em `MeuPerfil.jsx`, com bloqueio de troca obrigatória conduzido por `App.jsx`.
