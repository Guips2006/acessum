# SPEC-022: Perfil Completo e Troca de Senha

**Status:** Concluída  
**Objetivo:** Completar o perfil pessoal e permitir troca segura da senha.

## Requisitos

- O e-mail é apresentado como texto somente leitura e não é aceito como campo de alteração pelo endpoint de perfil.
- O titular pode completar nome, CPF, RG e data de nascimento de contas legadas e manter/atualizar seu avatar.
- O seletor nativo de arquivo fica visualmente oculto e acionável por controle acessível com ícone.
- A troca exige a senha atual, senha nova com pelo menos 12 caracteres e letras e números, e confirmação no frontend.
- Senha temporária só libera acesso a `/api/auth/me`, perfil e troca de senha; demais rotas permanecem bloqueadas até a troca.

## Persistência e compatibilidade

- Novos campos em `usuarios` usam migração aditiva.
- Registros legados mantêm `NULL` nos dados ausentes até o titular completá-los; nenhum CPF/RG/data é fabricado.

## Validação

- Confirmar e-mail imutável no cliente e API, perfil de titularidade, senha atual incorreta, divergência de confirmação e desbloqueio após troca.