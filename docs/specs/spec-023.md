# SPEC-023: Cadastro Seguro e Redefinição de Senha

**Status:** CONCLUÍDO<br>
**Objetivo:** Validar a identidade do titular por e-mail, CPF e PIN de segurança e permitir redefinição segura da senha, mantendo a opção de recuperação assistida pelo Administrador.

## Regras

- Novos cadastros exigem nome, e-mail, CPF, RG, data de nascimento e senha.
- CPF é normalizado para dígitos, validado pelo cálculo dos dígitos verificadores e único entre os valores não nulos.
- RG é normalizado e validado por tamanho; não é globalmente único porque o domínio não identifica o órgão emissor.
- Data de nascimento deve estar no passado. Senhas de cadastro e alteração autenticada mantêm a política existente de ao menos 12 caracteres e limite bcrypt de 72 bytes.
- A redefinição iniciada no login exige e-mail, CPF e PIN de segurança correspondentes a uma conta `ATIVO`. E-mail e CPF são comparados nas formas normalizadas armazenadas; o PIN fornecido é verificado contra seu hash bcrypt, nunca comparado nem persistido em texto plano.
- Falhas de validação não identificam conta nem informam qual campo divergiu. A API limita a cinco tentativas de validação por endereço IP em 15 minutos; armazena somente o hash do endereço e descarta tentativas após 24 horas.
- A validação emite token aleatório de uso único, válido por 10 minutos. Somente o hash do token é persistido; nova validação invalida tokens anteriores do mesmo usuário. O consumo e a alteração de senha são atômicos.
- Senhas definidas pelo reset exigem no mínimo 8 caracteres, uma letra maiúscula ASCII, uma minúscula ASCII, um número ASCII e um caractere especial não branco, sem exceder 72 bytes.
- A senha é persistida somente com hash bcrypt. A senha temporária gerada pelo Administrador também permanece no fluxo assistido existente e exige troca no próximo acesso.
- A migração SQLite é aditiva e cria as tabelas de tokens de reset e tentativas e a coluna anulável `usuarios.pin_hash`; contas legadas permanecem sem PIN (`NULL`) até configurá-lo no perfil.
- Contas sem PIN continuam podendo solicitar recuperação assistida pelo Administrador.

## Validação

- CPF inválido, RG malformado e data fora de DD/MM/AAAA são rejeitados pelo schema.
- Confirmar que e-mail, CPF e PIN são necessários; PIN incorreto/ausente ou conta inativa não obtém token, e a mensagem não revela qual validação falhou.
- Confirmar que falhas têm a mesma mensagem genérica, que a limitação por IP é aplicada e que o token fica armazenado apenas como hash.
- Confirmar que tokens expirados, consumidos ou substituídos não alteram a senha; o token só pode ser consumido uma vez.
- Confirmar requisitos de senha no backend, hash bcrypt, migração idempotente, PIN jamais retornado pela API e preservação do fluxo de solicitação assistida pelo Administrador.

## API, contratos e interface

- `POST /api/auth/validar-dados-reset` recebe `ValidarDadosResetRequest` (e-mail, CPF e PIN) e responde com token temporário e mensagem; o token é necessário para redefinir a senha.
- `POST /api/auth/redefinir-senha` recebe `RedefinirSenhaRequest`, consome o token e responde com `MensagemGenericaResponse`.
- `POST /api/auth/esqueci-senha` e `POST /api/notificacoes-conta/{notificacao_id}/redefinir` permanecem disponíveis para o fluxo assistido existente.
- Cadastro administrativo usa `UsuarioCriar` e retorna `UsuarioResponse`. Componentes: `App.jsx`, `GestaoUsuarios.jsx`, `SininhoNotificacoes.jsx` e `MeuPerfil.jsx`.
- A tela de login em `App.jsx` fornece as etapas de validação por e-mail, CPF e PIN, criação da nova senha, validação imediata e confirmação de sucesso; também mantém o caminho de recuperação assistida para contas sem PIN.
