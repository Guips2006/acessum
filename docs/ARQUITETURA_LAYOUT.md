# ARQUITETURA, LAYOUT E PADRÕES DE CÓDIGO (Projeto Acessum)

**Atenção, Agente IA:** Leia este documento com extrema atenção. Ele define os limites arquiteturais e o padrão visual do frontend (React) e backend (FastAPI). Desvios a este documento resultarão em reprovação do código.

## 1. Pilha Tecnológica (Stack)
* **Backend:** FastAPI (Python), SQLAlchemy (ORM), SQLite (Banco de Dados).
* **Frontend:** React (JavaScript).
* **Autenticação:** JWT (JSON Web Tokens) trafegado no formato `Bearer` no cabeçalho (HTTPBearer).
* **Bibliotecas Facilitadoras:** 
  * `axios` (para requisições HTTP simplificadas).
  * *Ícones* (podem ser emojis nativos para manter a simplicidade didática, ou biblioteca de ícones minimalista se previamente instalada).

## 1.1 Preferências de acessibilidade e carregamento (SPEC-014)
* `ThemeProvider` envolve a aplicação e mantém modo escuro e alto contraste em preferências locais do navegador.
* Os controles ficam na tela Configurações e devem ser utilizáveis por teclado, ter rótulos acessíveis e indicar seu estado.
* Operações assíncronas devem usar `LoadingSpinner` com rótulo em português; mensagens de erro, sucesso e estados vazios permanecem independentes.
* As animações devem respeitar a preferência de movimento reduzido do sistema operacional.

## 2. Padrões de Layout e UI/UX (Obrigatório)
O design deve ser **minimalista, didático e limpo**. O utilizador não deve ter dúvidas sobre o que clicar.

* **Cards:** Entidades (laboratórios, equipamentos, reservas) devem ser agrupadas visualmente em "Cards" (caixas).
  * *Estilo base:* Fundo branco ou cinza muito claro (`#ffffff` ou `#f9f9f9`), bordas suaves (`1px solid #e0e0e0`) e sombra leve (`box-shadow: 0 2px 4px rgba(0,0,0,0.05)`).
* **Arredondamento:** Bordas de botões, inputs e cards devem ser arredondadas (`border-radius: 8px`).
* **Paleta de Cores Minimalista:**
  * **Fundo da página:** Branco ou off-white.
  * **Texto Principal:** Cinza escuro/Quase preto (`#333333`).
  * **Ações Principais/Navegação:** Azul suave ou escuro (ex: `#0056b3`).
  * **Sucesso / Status ATIVO:** Verde (`#28a745` ou `#ccffcc` para fundos).
  * **Aviso / Ações Pendentes:** Laranja (`#ffc107`).
  * **Perigo / Status INATIVO / Logout:** Vermelho (`#dc3545` ou `#ffcccc` para fundos).
* **Inputs e Formulários:** Devem ocupar 100% da largura do seu contêiner pai, com espaçamento interno (padding de `10px`) para facilitar o clique.

## 3. Estrutura de Navegação (React)
Para manter o projeto simples e didático neste momento, **não utilize `react-router-dom`**.
* A navegação baseia-se em renderização condicional no ficheiro `App.jsx`.
* O estado `const [telaAtiva, setTelaAtiva] = useState('MENU')` controla o componente que está a ser renderizado na tela.
* Cada componente filho deve receber via *props* uma função para voltar (ex: `voltar={() => setTelaAtiva('MENU')}`).

## 4. Padrão de Comunicação HTTP
O agente IA **está estritamente proibido** de importar o `axios` diretamente nos componentes soltos ou usar `fetch`.
* Toda a comunicação com o backend DEVE extrair a instância pré-configurada da API através do Contexto.
* **Uso correto:**
  ```javascript
  import { useContext } from 'react';
  import { AuthContext } from './contexts/AuthContext';
  // ... dentro do componente:
  const { api } = useContext(AuthContext);
  // ... chamada:
  const response = await api.get('/api/rota/');