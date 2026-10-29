# SPEC-017: Dashboard Administrativo

**Status:** Concluída  
**Objetivo:** Apresentar indicadores de reservas e ocupação para o Administrador.  
**Atores:** Administrador.

## 1. Regras e métricas

- A tela e a API são exclusivas do perfil `ADMINISTRADOR`; a autorização é aplicada no backend.
- O período padrão são os últimos 30 dias. O usuário pode informar início e fim com fuso horário; ambos são obrigatórios quando enviados, o fim é exclusivo na API e a duração máxima é 366 dias.
- **Taxa de ocupação:** horas-unidade ocupadas divididas por horas-unidade disponíveis no período, multiplicadas por 100. O denominador é o número de laboratórios `ATIVO` multiplicado pelas horas corridas do período (operação 24 horas, pois o domínio não define expediente).
- O numerador soma a união dos intervalos de reserva `APROVADA`, `EM_USO` e `CONCLUIDA` por laboratório ativo; intervalos sobrepostos são contados uma única vez. Reservas concluídas usam `data_fim_real` quando disponível; as demais usam `data_fim`.
- A distribuição por status conta reservas com `data_inicio` dentro do período e retorna todos os status conhecidos, inclusive valores zero.
- A evolução de faltas conta `NO_SHOW` por `data_no_show` em cada dia do período, incluindo dias sem ocorrências. A data gravada pela SPEC-016 é a referência da métrica.
- Períodos sem laboratórios ativos resultam em ocupação de 0%; gráficos sem dados exibem estado vazio.

## 2. API e interface

- `GET /api/dashboard/reservas`: aceita `data_inicio` e `data_fim` ISO-8601 com fuso, ou nenhum parâmetro para usar o padrão; exige token de Administrador.
- A resposta inclui o período normalizado, taxa de ocupação, quantidades por status e série diária de `NO_SHOW`.
- A interface usa Recharts para os gráficos, filtros de data e estados de carregamento, vazio e erro.

## 3. Persistência e validação

- Um índice aditivo em `reservas(status, data_inicio)` apoia a consulta por status/período; a migração usa `CREATE INDEX IF NOT EXISTS`.
- Validar autorização para Administrador e rejeição para outros perfis, fuso e intervalo inválidos, limite de 366 dias, união sem dupla contagem, exclusão de laboratórios inativos e série de `NO_SHOW`.