# SPEC-020: Log de Auditoria

**Status:** Concluída  
**Objetivo:** Registrar e consultar ações críticas do sistema com autoria e contexto.  
**Atores:** Administrador (consulta); usuários autenticados que executam ações auditáveis (registro automático).

## 1. Regras de negócio

- Cada evento registra o identificador do ator autenticado, ação, entidade, ID da entidade, descrição concisa e data/hora UTC.
- O log é criado na mesma transação da mutação: se a operação falhar ou sofrer rollback, o registro correspondente também não é persistido.
- Ações cobertas: cadastro, ativação/inativação de usuário; criação de laboratório e ativação/inativação de laboratório; aprovação/recusa de reserva; atualização do próprio perfil.
- Não registrar senhas, hashes, tokens, arquivos enviados ou conteúdo desnecessário de dados pessoais.
- Os registros são somente de inserção pela aplicação; não há endpoint para editar ou excluir logs.
- A consulta é exclusiva para `ADMINISTRADOR` e oferece filtros por ação, ator, entidade e período, com paginação de até 500 registros.

## 2. Persistência e API

- A tabela `logs_auditoria` é criada por migração aditiva e idempotente, sem reconstruir tabelas existentes.
- Índices apoiam filtros por data/ação e ator.
- `GET /api/auditoria` retorna registros em ordem decrescente de data/hora, com nome e perfil do ator e metadados de paginação.
- A API valida que datas sejam fornecidas juntas, incluam fuso e definam intervalo válido.

## 3. Interface

- A entrada e a rota de Auditoria aparecem apenas para Administradores; o backend repete a autorização.
- A tela apresenta data/hora, responsável, perfil, ação, entidade e descrição, com filtros e paginação.
- Ações de escrita não exibem notificações ou confirmações adicionais de auditoria; o registro acontece silenciosamente.

## 4. Validação

- Confirmar cada ação crítica com o ator correto e a data UTC.
- Confirmar rollback sem log para operações inválidas.
- Confirmar `403` para perfis não administrativos, filtros/paginação e preservação dos registros após reaplicar migrações.