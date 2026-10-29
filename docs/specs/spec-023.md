# SPEC-023: Cadastro Seguro e Redefinição de Senha

**Status:** Concluída  
**Objetivo:** Exigir dados de identidade em novos cadastros e permitir recuperação assistida de senha.

## Regras

- Novos cadastros exigem nome, e-mail, CPF, RG, data de nascimento e senha.
- CPF é normalizado para dígitos, validado pelo cálculo dos dígitos verificadores e único entre os valores não nulos.
- RG é normalizado e validado por tamanho; não é globalmente único porque o domínio não identifica o órgão emissor.
- Data de nascimento deve estar no passado. Senhas novas têm ao menos 12 caracteres, letras e números, respeitando o limite bcrypt de 72 bytes.
- A migração adiciona CPF, RG, nascimento e `deve_trocar_senha` sem inventar valores para contas existentes.
- O endpoint público de esqueci a senha sempre retorna a mesma mensagem, exista ou não uma conta ativa para o e-mail.
- Pedidos válidos geram notificações de conta deduplicadas para Administradores ativos. A tabela de notificações de reserva não é alterada nem recebe associações artificiais.
- O Administrador gera senha temporária aleatória, exibida uma única vez; apenas o hash é persistido. O próximo acesso exige troca.

## Validação

- CPF com dígitos inválidos, RG fora do tamanho e datas futuras são rejeitados.
- E-mail existente e inexistente têm resposta indistinguível no reset.
- Confirmar deduplicação, autorização Admin, senha temporária não persistida em texto e bloqueio de rotas até a troca.