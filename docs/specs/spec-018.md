# SPEC-018: Exportação de Relatórios

**Status:** Concluída  
**Objetivo:** Exportar reservas filtradas em CSV ou PDF para análise e arquivamento.  
**Atores:** Administrador, Aluno e Professor.

## 1. Regras de negócio e acesso

- A exportação administrativa inclui reservas de todos os usuários e exige perfil `ADMINISTRADOR` no backend.
- A exportação do Histórico aceita Aluno ou Professor autenticado e inclui exclusivamente reservas cujo `usuario_id` corresponda ao titular do token.
- O frontend não define o escopo dos dados; a API aplica a autorização e o filtro de titularidade.
- Os filtros opcionais são intervalo de início e fim (ambos juntos, fim exclusivo) e status da reserva.
- Datas devem incluir fuso horário; períodos têm duração máxima de 366 dias. Cada arquivo pode conter até 10.000 reservas.
- A tentativa de exportar mais registros retorna `413` com orientação para reduzir o período ou filtrar por status.

## 2. Conteúdo e formatos

- Os arquivos contêm laboratório, período, finalidade e status; a exportação administrativa inclui também o solicitante. O motivo de recusa aparece quando existe.
- CSV usa UTF-8 com BOM para compatibilidade com planilhas comuns e escape fornecido pelo módulo padrão `csv`.
- PDF é paginado, em orientação paisagem, com cabeçalho repetido e células que quebram texto longo.
- O nome do arquivo contém data/hora de geração e extensão correspondente.

## 3. Interface

- Dashboard administrativo exporta o intervalo selecionado.
- Histórico permite filtrar por datas e status e exportar o resultado com formato selecionável.
- A interface indica o formato durante o processamento e mostra erro/sucesso sem limpar os filtros.

## 4. Validação

- Confirmar resposta CSV e PDF, codificação/caracteres especiais e nome/extensão do arquivo.
- Confirmar que usuário comum não acessa exportação global e que o histórico não inclui reservas de terceiros.
- Confirmar filtros de período/status, validação do limite temporal e rejeição de volume acima de 10.000 linhas.