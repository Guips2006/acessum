# SPEC-001: Autenticação e controle de acesso

**Status:** CONCLUÍDO<br>
**Escopo:** autenticar os perfis Aluno, Professor e Administrador, identificar a pessoa autenticada e aplicar autorização por perfil nas rotas e na navegação.

## Regras

- O login valida a senha contra seu hash e retorna um JWT; endpoints protegidos exigem o esquema `Bearer`.
- Perfis e status são atributos de `Usuario`, não entidades separadas. A API valida autorização; ocultar ações na interface não substitui essa validação.
- Contas `INATIVO` não podem fazer login. Contas `SUSPENSO` ainda podem autenticar e consultar funções permitidas, mas não podem solicitar reservas.
- Senhas são armazenadas com hash bcrypt. O token não deve ser tratado como dado de autorização confiável no cliente.

## API e contratos

- `POST /api/auth/login` recebe `{ "email": "...", "senha": "..." }` (`DadosLogin`) e responde com token, nome, e-mail, perfil, status, status de troca obrigatória, suspensão, avatar e última atividade.
- `GET /api/auth/me` retorna a identidade e os atributos públicos da conta autenticada, sem senha ou hash.
- `POST /api/auth/alterar-senha` recebe `AlterarSenha` (`senha_atual`, `nova_senha`) e retorna mensagem e estado de troca obrigatória.
- A autorização de rota é aplicada pela dependência `exigir_perfil`; os contratos de usuário são complementados por `UsuarioResponse` e `PerfilUsuarioResponse`.

## Interface

- `App.jsx` controla login, navegação conforme perfil e bloqueio de sessão quando há troca de senha obrigatória.
- `AuthContext.jsx` mantém a sessão e a instância autenticada de API; chamadas usam `Authorization: Bearer`.
- A navegação mostra funções diferentes para Aluno, Professor e Administrador, mas a API permanece a fonte de verdade das permissões.
