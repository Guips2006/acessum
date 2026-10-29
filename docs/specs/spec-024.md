# SPEC-024: Bloqueio de Datas Passadas

**Status:** Concluída  
**Objetivo:** Impedir reservas com início no passado.

## Regras

- O campo de início usa o horário local atual como `min`; o campo de fim usa o início escolhido ou o horário atual como mínimo.
- O backend converte as datas para UTC e rejeita início igual ou anterior ao instante atual, independentemente do cliente.
- As regras existentes de fim posterior ao início permanecem intactas.

## Validação

- Verificar os atributos `min` e sua atualização ao escolher o início.
- Confirmar `422` para início passado e sucesso para período futuro válido.