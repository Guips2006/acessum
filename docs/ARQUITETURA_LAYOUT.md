# Arquitetura, layout e padrões de interface — Acessum

Este documento descreve os padrões observados no código atual do Acessum. Para divergências entre esta referência e a implementação, validar o comportamento nos componentes e estilos correspondentes antes de propor mudanças.

## 1. Pilha e organização

- **Backend:** Python, FastAPI, SQLAlchemy e SQLite.
- **Frontend:** aplicação React em JavaScript, compilada pelo Vite.
- **Autenticação:** token JWT no esquema `Bearer`; a instância Axios é fornecida pelo `AuthContext`.
- **Navegação autenticada:** renderização condicional por `telaAtiva` em `App.jsx`, sem rotas de página do React Router.
- **Ícones:** `lucide-react`; ícones decorativos usam `aria-hidden="true"` e controles devem manter nome acessível.

## 2. Temas, contraste e tokens CSS

`ThemeProvider` guarda as preferências no `localStorage` sob a chave `acessum-preferencias-tema` e aplica atributos ao elemento raiz:

- `data-theme="claro"` ou `data-theme="escuro"`;
- `data-contraste="normal"` ou `data-contraste="alto"`.

Os tokens globais definidos em `frontend/src/styles.css` incluem `--ink`, `--muted`, `--line`, `--surface`, `--canvas`, `--navy`, `--blue`, `--blue-hover`, `--green`, `--red`, `--amber`, `--shadow-sm` e `--shadow-md`. Os seletores de tema redefinem cores e sombras; a combinação de alto contraste com modo escuro possui conjunto próprio. Novos estilos devem priorizar esses tokens em vez de fixar cores por componente.

As opções de aparência ficam em Configurações, e a tela de login também expõe a alternância entre claro e escuro antes da autenticação. Modo escuro e alto contraste são independentes e podem ser combinados. Na ausência de preferência, a interface usa tema claro e contraste normal.

## 3. Espaçamento, superfícies e responsividade

- A interface usa superfícies, bordas, sombras e cantos arredondados para separar grupos de conteúdo; não há escala global única de espaçamento. Ao alterar um componente, manter os paddings e gaps usados pelos componentes vizinhos, sem introduzir valores globais fictícios.
- Inputs, botões, cards e tabelas devem preservar hierarquia visual, áreas de clique confortáveis e foco visível.
- O layout desktop organiza o conteúdo em uma barra lateral e uma barra superior. Em larguras menores, a barra lateral transforma-se em uma faixa de navegação horizontal com rolagem horizontal; o CSS esconde a barra de rolagem visual e preserva os itens navegáveis.
- Não presumir que o menu mobile seja um drawer: o comportamento atual é uma faixa horizontal rolável.
- A grade semanal apresenta datas DD/MM/AAAA no campo textual e mantém um seletor nativo de calendário separado; o formato interno da API continua ISO-8601.

## 4. Acessibilidade e estados de interface

- Controles interativos precisam de texto visível ou nome acessível (`aria-label`, rótulo associado ou equivalente), foco perceptível e operação por teclado.
- Botões compostos apenas por ícone devem ter nome acessível; ícones sem significado autônomo devem ser ocultos de tecnologias assistivas.
- Estados de carregamento usam `LoadingSpinner` com rótulo em português; mensagens de erro, sucesso, lista vazia e conteúdo carregado permanecem distintos.
- Animações respeitam `prefers-reduced-motion: reduce`.
- Não comunicar status apenas por cor: incluir texto ou outro indicador compreensível.
- Preservar estados `aria-expanded`, `aria-pressed` e `aria-invalid` quando aplicáveis aos componentes existentes.

## 5. Comunicação com a API

Componentes React devem obter `api` de `AuthContext`, que configura a origem e o cabeçalho de autenticação. Evitar criar clientes Axios independentes ou usar `fetch` diretamente em telas. As verificações de identidade e autorização permanecem no backend; ocultar ações na interface não substitui autorização de rota.

```jsx
const { api } = useContext(AuthContext);
const resposta = await api.get('/api/rota');
```

## 6. Referências de implementação

- Temas e persistência: `frontend/src/contexts/ThemeContext.jsx` e `frontend/src/Configuracoes.jsx`.
- Navegação, cabeçalho, acesso por perfil e menu de conta: `frontend/src/App.jsx`.
- Variáveis, breakpoints, foco e movimento reduzido: `frontend/src/styles.css`.
- Requisições autenticadas: `frontend/src/contexts/AuthContext.jsx`.
- Estados de carregamento: `frontend/src/components/LoadingSpinner.jsx`.
