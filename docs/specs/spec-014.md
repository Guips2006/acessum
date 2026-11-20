# SPEC-014: Preferências de Acessibilidade e Indicadores de Carregamento

**Status:** Concluída  
**Objetivo:** Permitir que cada pessoa ajuste a apresentação visual do Acessum e receba feedback consistente durante operações assíncronas.  
**Atores:** Aluno, Professor e Administrador.

## 1. Regras e critérios de aceitação

- As configurações devem estar disponíveis para todos os perfis autenticados.
- O modo escuro e o alto contraste são preferências independentes, podem ser combinados e devem ser salvos no `localStorage` do navegador.
- Na ausência de preferência salva, a interface usa o tema claro e o contraste normal.
- Os controles devem ser identificados em português, operáveis por teclado e expor seu estado ligado/desligado a tecnologias assistivas.
- Toda requisição assíncrona que apresente carregamento e toda ação assíncrona iniciada por botão deve exibir um indicador visual padronizado e texto de estado acessível.
- O indicador não substitui mensagens de erro, sucesso, lista vazia ou o conteúdo carregado.
- Animações do indicador devem respeitar `prefers-reduced-motion`.
- A preferência de tema não altera permissões, dados, endpoints ou regras de negócio das SPECs 001–013.

## 2. Implementação de interface

- `ThemeProvider` envolve a aplicação e aplica os atributos de tema e contraste ao elemento raiz do documento.
- A tela `Configuracoes.jsx`, aberta pela navegação existente em `App.jsx`, contém os controles de modo escuro e alto contraste.
- `LoadingSpinner` padroniza os indicadores de carregamento de tela e de ação, com rótulo anunciado por leitores de tela.
- Os estilos usam variáveis CSS para temas e regras específicas para compatibilidade com componentes legados que ainda usam estilos inline.

## 3. Validação

- Build de produção do frontend deve concluir sem erros.
- Verificar persistência após recarregar e combinação independente dos dois controles.
- Verificar foco visível, operação por teclado e anúncio do estado de carregamento.
- Confirmar que listas, formulários, feedbacks e ações existentes continuam funcionais nos três modos visuais.