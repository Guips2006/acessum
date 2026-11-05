# SPEC-021: Polimento Visual e Navegação

**Status:** CONCLUÍDO<br>
**Objetivo:** Harmonizar a interface e concentrar as ações da conta em um menu de usuário.

## Requisitos

- Header, superfícies e controles acompanham o tema escuro e alto contraste.
- Alternância visual usa ícones Lua/Sol com estado acessível.
- A tela de login permite alternar claro/escuro antes da autenticação, usando as preferências persistidas pelo `ThemeContext`.
- Fundo e superfícies do login acompanham os tokens globais de tema; o painel lateral mantém o tratamento visual de marca.
- A marca combina símbolo e tipografia do produto; botões de alerta usam âmbar legível e consistente.
- O carregamento inicial apresenta spinner médio centralizado, com rótulo acessível sem texto visual.
- Meu perfil, Configurações e Sair ficam em dropdown aberto pelo usuário no header; não aparecem na navegação principal.
- O Aluno tem acesso explícito ao Dashboard/Visão geral.
- Login usa ícones acessíveis para visibilidade da senha.

## Validação

- Testar header e menus em modo claro, escuro e alto contraste, em desktop e viewport móvel.
- Testar seletor de tema e toda a área da tela de login nos três modos visuais antes da autenticação.
- Confirmar navegação por teclado, foco visível, labels acessíveis e loading sem texto visual.

## Implementação

Esta SPEC não introduz endpoints nem contratos de API. Os componentes centrais são `App.jsx`, `Configuracoes.jsx`, `MeuPerfil.jsx` e `SininhoNotificacoes.jsx`; estilos, foco e comportamento responsivo ficam em `styles.css`. Ícones usam `lucide-react`.
