import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import GestaoUsuarios from './GestaoUsuarios';
import GestaoLaboratorios from './GestaoLaboratorios';
import ConsultaRecursos from './ConsultaRecursos';
import GestaoEquipamentos from './GestaoEquipamentos';
import GestaoProblemas from './GestaoProblemas';
import AnalisarReservas from './AnalisarReservas';
import HistoricoReservas from './HistoricoReservas';

const navegacaoAluno = [
  { tela: 'CONSULTA_RECURSOS', icon: '⌕', label: 'Explorar recursos' },
  { tela: 'HISTORICO_RESERVAS', icon: '▤', label: 'Minhas reservas' },
];

export default function App() {
  const { user, login, logout, loading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [telaAtiva, setTelaAtiva] = useState('MENU'); // Controle de qual tela mostrar

  if (loading) {
    return (
      <div className="app-loading" role="status">
        <span className="loading-spinner" />
        <span>A preparar o Acessum...</span>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, senha);
    if (!result.success) setErro(result.message);
  };

  const handleLogout = () => {
    // 1. Chama a função de logout do contexto (remove token, altera estado do user)
    logout();

    // 2. Limpa os estados locais do formulário
    setEmail('');
    setSenha('');
    setErro(''); // Opcional, mas recomendado para limpar mensagens de erro antigas
  };

  if (user) {
    const nomeTela = {
      MENU: 'Visão geral',
      CONSULTA_RECURSOS: 'Explorar recursos',
      HISTORICO_RESERVAS: 'Minhas reservas',
      ANALISAR_RESERVAS: 'Analisar solicitações',
      GESTAO_USUARIOS: 'Gestão de usuários',
      GESTAO_LABORATORIOS: 'Laboratórios',
      GESTAO_EQUIPAMENTOS: 'Equipamentos',
      GESTAO_PROBLEMAS: 'Relatos de problemas',
    }[telaAtiva] || 'Acessum';

    const navItem = (tela, icon, label) => (
      <button
        key={tela}
        type="button"
        className={`sidebar-link${telaAtiva === tela ? ' is-active' : ''}`}
        onClick={() => setTelaAtiva(tela)}
      >
        <span className="sidebar-icon" aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </button>
    );

    return (
      <div className="app-shell">
        <aside className="app-sidebar">
          <button
            type="button"
            className="brand-lockup"
            onClick={() => setTelaAtiva('MENU')}
            aria-label="Acessum - página inicial"
          >
            <span className="brand-mark">A</span>
            <span className="brand-name">acessum<span>.</span></span>
          </button>

          <div className="sidebar-section-label">Workspace</div>
          <nav className="sidebar-nav" aria-label="Navegação principal">
            {navItem('MENU', '⌂', 'Visão geral')}
            {['ALUNO', 'PROFESSOR'].includes(user.perfil) && navegacaoAluno.map(item => (
              navItem(item.tela, item.icon, item.label)
            ))}
            {user.perfil === 'PROFESSOR' && navItem('ANALISAR_RESERVAS', '✓', 'Solicitações')}
            {user.perfil === 'ADMINISTRADOR' && (
              <>
                <div className="sidebar-section-label sidebar-section-spaced">Administração</div>
                {navItem('GESTAO_USUARIOS', '♙', 'Usuários')}
                {navItem('GESTAO_LABORATORIOS', '⌂', 'Laboratórios')}
                {navItem('GESTAO_EQUIPAMENTOS', '▦', 'Equipamentos')}
                {navItem('GESTAO_PROBLEMAS', '△', 'Relatos de problemas')}
              </>
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span className="user-avatar">{user.nome?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="sidebar-user-copy">
                <strong>{user.nome}</strong>
                <small>{user.perfil}</small>
              </span>
            </div>
            <button type="button" className="logout-button" onClick={handleLogout}>
              <span aria-hidden="true">↪</span> Sair do sistema
            </button>
          </div>
        </aside>

        <div className="app-workspace">
          <header className="topbar">
            <div>
              <span className="topbar-eyebrow">Acessum / Workspace</span>
              <h1>{nomeTela}</h1>
            </div>
            <div className="topbar-profile">
              <span className="status-indicator" />
              <span>Sessão ativa</span>
              <span className="topbar-avatar">{user.nome?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
          </header>

          <main className="app-content">
            {telaAtiva === 'GESTAO_USUARIOS' && user.perfil === 'ADMINISTRADOR' && (
              <GestaoUsuarios voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'GESTAO_LABORATORIOS' && (
              <GestaoLaboratorios voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'GESTAO_EQUIPAMENTOS' && (
              <GestaoEquipamentos voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'GESTAO_PROBLEMAS' && user.perfil === 'ADMINISTRADOR' && (
              <GestaoProblemas voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'ANALISAR_RESERVAS' && user.perfil === 'PROFESSOR' && (
              <AnalisarReservas voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'HISTORICO_RESERVAS' && ['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
              <HistoricoReservas voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'CONSULTA_RECURSOS' && ['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
              <ConsultaRecursos voltar={() => setTelaAtiva('MENU')} />
            )}

            {telaAtiva === 'MENU' && (
              <section className="dashboard-view">
                <div className="welcome-panel">
                  <div className="welcome-copy">
                    <span className="eyebrow">ESPAÇO DE TRABALHO</span>
                    <h2>Olá, {user.nome?.split(' ')[0] || 'bem-vindo'}.</h2>
                    <p>Encontre um espaço, acompanhe as suas reservas e mantenha tudo a funcionar.</p>
                  </div>
                  <div className="welcome-graphic" aria-hidden="true">
                    <span className="graphic-orbit orbit-one" />
                    <span className="graphic-orbit orbit-two" />
                    <span className="graphic-core">A</span>
                  </div>
                </div>

                <div className="section-heading">
                  <div>
                    <span className="eyebrow">ATALHOS</span>
                    <h2>Aceda às suas tarefas</h2>
                  </div>
                  <span className="profile-pill">{user.perfil}</span>
                </div>

                <div className="dashboard-grid">
                  {['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
                    <>
                      <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('CONSULTA_RECURSOS')}>
                        <span className="dashboard-card-icon icon-blue">⌕</span>
                        <span className="dashboard-card-title">Explorar recursos</span>
                        <span className="dashboard-card-description">Consulte laboratórios, equipamentos e disponibilidade.</span>
                        <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                      </button>
                      <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('HISTORICO_RESERVAS')}>
                        <span className="dashboard-card-icon icon-violet">▤</span>
                        <span className="dashboard-card-title">Minhas reservas</span>
                        <span className="dashboard-card-description">Acompanhe pedidos, check-in e utilização em curso.</span>
                        <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                      </button>
                    </>
                  )}
                  {user.perfil === 'PROFESSOR' && (
                    <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('ANALISAR_RESERVAS')}>
                      <span className="dashboard-card-icon icon-amber">✓</span>
                      <span className="dashboard-card-title">Solicitações</span>
                      <span className="dashboard-card-description">Analise, aprove ou recuse pedidos pendentes.</span>
                      <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                    </button>
                  )}
                  {user.perfil === 'ADMINISTRADOR' && (
                    <>
                      <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('GESTAO_USUARIOS')}>
                        <span className="dashboard-card-icon icon-blue">♙</span>
                        <span className="dashboard-card-title">Usuários</span>
                        <span className="dashboard-card-description">Crie contas e administre os acessos ao sistema.</span>
                        <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                      </button>
                      <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('GESTAO_LABORATORIOS')}>
                        <span className="dashboard-card-icon icon-green">⌂</span>
                        <span className="dashboard-card-title">Laboratórios</span>
                        <span className="dashboard-card-description">Mantenha os espaços e as suas capacidades.</span>
                        <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                      </button>
                      <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('GESTAO_EQUIPAMENTOS')}>
                        <span className="dashboard-card-icon icon-violet">▦</span>
                        <span className="dashboard-card-title">Equipamentos</span>
                        <span className="dashboard-card-description">Organize os equipamentos associados aos espaços.</span>
                        <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                      </button>
                      <button type="button" className="dashboard-card" onClick={() => setTelaAtiva('GESTAO_PROBLEMAS')}>
                        <span className="dashboard-card-icon icon-amber">△</span>
                        <span className="dashboard-card-title">Relatos de problemas</span>
                        <span className="dashboard-card-description">Acompanhe ocorrências reportadas pela comunidade.</span>
                        <span className="dashboard-card-arrow">Abrir <span aria-hidden="true">↗</span></span>
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">A</span>
          <span className="brand-name">acessum<span>.</span></span>
        </div>
        <span className="eyebrow">GESTÃO DE LABORATÓRIOS</span>
        <h1>Bem-vindo de volta</h1>
        <p className="login-description">Entre com a sua conta para aceder aos espaços e reservas.</p>
        {erro && <p className="feedback feedback-error" role="alert">{typeof erro === 'string' ? erro : 'Erro de validação no login. Verifique os dados.'}</p>}
        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            autoComplete="username"
            placeholder="nome@instituicao.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="A sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button type="submit" className="button-primary login-submit">Entrar na plataforma</button>
        </form>
        <p className="login-footnote">Acesso seguro para a comunidade Acessum.</p>
      </section>
      <aside className="login-aside">
        <div className="login-aside-content">
          <span className="eyebrow">ESPAÇOS PARA APRENDER</span>
          <h2>O próximo grande projeto começa com o espaço certo.</h2>
          <p>Consulte laboratórios, acompanhe reservas e simplifique a gestão dos recursos académicos.</p>
          <div className="login-aside-stat">
            <span className="stat-mark">✳</span>
            <span>Um lugar para aprender, criar e colaborar.</span>
          </div>
        </div>
        <div className="login-aside-shape shape-large" />
        <div className="login-aside-shape shape-small" />
      </aside>
    </main>
  );
}
