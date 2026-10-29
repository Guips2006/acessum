# SPEC-015: Perfil, Avatar e Última Atividade

**Status:** Concluída  
**Objetivo:** Permitir que cada usuário atualize seus dados básicos, envie uma foto de perfil e consulte sua última atividade.  
**Atores:** Aluno, Professor e Administrador.

## 1. Regras de negócio e dados

- Um usuário autenticado só pode consultar ou editar o próprio perfil.
- Os dados editáveis são nome e e-mail; e-mail continua único no sistema e é normalizado para minúsculas.
- A foto é opcional. São aceitos somente arquivos PNG e JPEG de até 5 MiB; o backend valida o conteúdo da imagem e não usa o nome original do arquivo.
- A URL do avatar é relativa à aplicação e aponta para um arquivo estático salvo pelo backend.
- `ultima_atividade` é registrada em UTC no login bem-sucedido e em chamadas autenticadas da API. O acesso anônimo não altera o campo.
- Contas antigas recebem `NULL` nos dois novos campos; a atividade passa a ser registrada nos próximos acessos. Nenhum dado existente é apagado ou regravado.

## 2. Persistência e API

- A tabela `usuarios` recebe as colunas anuláveis `avatar_url` e `ultima_atividade` por migração aditiva, idempotente e centralizada em `backend/migrations.py`.
- `PATCH /api/perfil/me` recebe `nome`, `email` e um campo opcional `avatar` no formato multipart.
- `GET /api/auth/me` e a resposta de login incluem `avatar_url` e `ultima_atividade` sem expor credenciais.
- A API valida duplicidade de e-mail, tipo real da imagem, tamanho e resolução; falhas não devem substituir o avatar anterior.
- Arquivos são servidos sob `/static/avatars/`; o diretório de uploads não é versionado.

## 3. Interface

- `MeuPerfil.jsx` é acessível a todos os perfis pela navegação existente.
- A tela permite alterar nome e e-mail, selecionar uma foto com pré-visualização e consultar a última atividade registrada.
- A interface exibe estados de envio, sucesso e erro, e atualiza o usuário em memória após salvar.

## 4. Validação

- Aplicar a migração duas vezes sobre um schema legado e confirmar que os dados existentes permanecem iguais.
- Confirmar que nome/e-mail são editados somente pelo titular e que e-mail duplicado retorna conflito.
- Testar upload PNG/JPEG válido, tipo incorreto, imagem inválida, arquivo acima de 5 MiB e substituição de avatar.
- Confirmar atualização de `ultima_atividade` no login e em chamadas autenticadas.