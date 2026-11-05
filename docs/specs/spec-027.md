# SPEC-027: Laboratórios favoritos

**Status:** CONCLUÍDO<br>
**Objetivo:** Permitir ao aluno guardar laboratórios preferidos e iniciar rapidamente uma solicitação de reserva.<br>
**Atores:** Aluno.

## 1. Persistência e compatibilidade

- A tabela aditiva `favoritos_usuarios` relaciona `usuario_id` e `laboratorio_id`; a chave composta impede duplicidade e as referências são removidas junto com a entidade relacionada quando houver exclusão física.
- A criação da tabela e do índice é idempotente e fica em `backend/migrations.py`. Dados e tabelas anteriores não são reconstruídos nem apagados.

## 2. API

- `GET /api/favoritos`: lista somente os favoritos do aluno autenticado.
- `PUT /api/favoritos/{laboratorio_id}`: adiciona o laboratório; repetir a operação retorna o favorito existente.
- `DELETE /api/favoritos/{laboratorio_id}`: remove somente o vínculo do aluno autenticado.
- As rotas exigem perfil `ALUNO`; laboratório inexistente ou favorito não encontrado retorna erro explícito.

## 3. Interface

- A exploração de recursos apresenta controle de estrela com estado acessível.
- O Dashboard exibe os favoritos. “Solicitar reserva” abre o formulário já no laboratório escolhido; não envia automaticamente uma reserva, pois período e finalidade continuam obrigatórios pela SPEC-007.
- Favoritos de laboratório inativo permanecem listados, mas não permitem iniciar uma nova solicitação.
- **Contrato:** respostas usam `FavoritoResponse` (`id`, `nome`, `capacidade`, `status`); exclusão retorna `204` sem corpo. O vínculo persistente usa `FavoritoUsuario`.
- **Componentes:** `ConsultaRecursos.jsx` e `DashboardAluno.jsx`; formulário em `SolicitarReserva.jsx`.

## 4. Validação

- Dois alunos mantêm listas independentes.
- Repetir a inclusão não cria linhas duplicadas e remover um favorito não altera os demais.
- O formulário aberto pelo Dashboard preserva as validações originais da SPEC-007 e da SPEC-024.
