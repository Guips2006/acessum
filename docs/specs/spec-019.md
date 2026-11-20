# SPEC-019: Notificações In-App

**Status:** Concluída  
**Objetivo:** Informar o Aluno sobre decisões de reservas e proximidade do check-in.  
**Atores:** Aluno e sistema.

## 1. Eventos e regras

- A aprovação ou recusa de uma reserva de Aluno cria uma notificação na mesma transação que atualiza a reserva.
- Quando uma reserva de Aluno, aprovada e futura, entrar na janela de até 30 minutos antes do início, é criado um lembrete de check-in.
- O job existente verifica os lembretes a cada 60 segundos; o frontend atualiza a lista a cada 30 segundos enquanto a sessão está ativa.
- Uma restrição única em `(reserva_id, tipo)` impede duplicação por reexecução do job ou repetição de chamada.
- Notificações são persistentes, não lidas por padrão e pertencem ao usuário titular. Aluno ou Professor autenticado só lista e marca as próprias notificações; nenhuma ação permite acesso a mensagens de terceiros.
- O sino é exibido para todos os perfis autenticados; decisões e lembretes especificados são destinados ao Aluno solicitante.

## 2. Persistência e API

- A tabela `notificacoes` guarda titular, reserva, tipo, título, mensagem, criação e estado de leitura; sua criação é aditiva e idempotente.
- `GET /api/notificacoes` retorna as 50 mais recentes e o total não lido do titular autenticado.
- `PATCH /api/notificacoes/{id}/lida` marca uma notificação própria como lida e retorna `404` para IDs inexistentes ou de terceiros.
- `PATCH /api/notificacoes/lidas` marca as notificações próprias como lidas em lote.
- Tipos permitidos: `RESERVA_APROVADA`, `RESERVA_RECUSADA` e `CHECKIN_30_MIN`.

## 3. Interface

- O sino na barra superior apresenta o total não lido, atualiza a cada 30 segundos e abre um painel responsivo com mensagens e horários.
- A pessoa pode marcar uma notificação individual ou todas como lidas; estados vazio, carregamento e erro são comunicados.

## 4. Validação

- Aprovação/recusa cria a mensagem esperada para o Aluno e nenhuma para Professor.
- O job cria um único lembrete na janela de 30 minutos e não duplica ao rodar novamente.
- Usuário não lê nem marca notificações de outra conta; leitura individual e em lote atualizam a contagem.
- Reaplicar a migração não apaga notificações nem recria duplicatas.