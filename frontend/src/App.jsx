import React, { Suspense, lazy, useContext, useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, EyeOff, FlaskConical, LogOut, Settings, UserRound } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import Configuracoes from './Configuracoes';
import MeuPerfil from './MeuPerfil';
import GestaoUsuarios from './GestaoUsuarios';
import GestaoLaboratorios from './GestaoLaboratorios';
import ConsultaRecursos from './ConsultaRecursos';
import GestaoEquipamentos from './GestaoEquipamentos';
import GestaoProblemas from './GestaoProblemas';
import AnalisarReservas from './AnalisarReservas';
import HistoricoReservas from './HistoricoReservas';
import SininhoNotificacoes from './SininhoNotificacoes';
import Auditoria from './Auditoria';

const DashboardAdmin = lazy(() => import('./DashboardAdmin.jsx'));

const navegacaoAluno = [
  { tela: 'CONSULTA_RECURSOS', icon: '⌕', label: 'Explorar recursos' },
  { tela: 'HISTORICO_RESERVAS', icon: '▤', label: 'Minhas reservas' },
];

export default function App() {
  const { user, login, logout, loading, api } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [solicitandoReset, setSolicitandoReset] = useState(false);
  const [resetSolicitado, setResetSolicitado] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState('MENU'); // Controle de qual tela mostrar
  const menuUsuarioRef = useRef(null);

  useEffect(() => {
    if (!menuUsuarioAberto) return undefined;

    const fecharMenuAoClicarFora = (evento) => {
      if (!menuUsuarioRef.current?.contains(evento.target)) {
        setMenuUsuarioAberto(false);
      }
    };

    document.addEventListener('pointerdown', fecharMenuAoClicarFora);
    return () => document.removeEventListener('pointerdown', fecharMenuAoClicarFora);
  }, [menuUsuarioAberto]);

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner label="Carregando" large visuallyHiddenLabel />
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setEntrando(true);
    try {
      const result = await login(email, senha);
      if (!result.success) setErro(result.message);
    } finally {
      setEntrando(false);
    }
  };

  const handleEsqueciSenha = async () => {
    setErro('');
    setResetSolicitado(false);
    if (!email.trim()) {
      setErro('Informe seu e-mail para solicitar a redefinição.');
      return;
    }
    setSolicitandoReset(true);
    try {
      await api.post('/api/auth/esqueci-senha', { email });
      setResetSolicitado(true);
    } catch (falha) {
      setErro(falha.response?.data?.detail || 'Não foi possível registrar a solicitação.');
    } finally {
      setSolicitandoReset(false);
    }
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
    if (user.deve_trocar_senha) {
      return (
        <main className="forced-password-page">
          <div className="forced-password-heading">
            <div className="login-brand">
              <span className="brand-mark"><FlaskConical size={21} aria-hidden="true" /></span>
              <span className="brand-name">acessum<span>.</span></span>
            </div>
            <button type="button" className="forced-password-logout" onClick={handleLogout}>
              <LogOut size={17} aria-hidden="true" /> Sair
            </button>
          </div>
          <MeuPerfil voltar={() => {}} trocaObrigatoria />
        </main>
      );
    }

    const nomeTela = {
      MENU: 'Visão geral',
      CONSULTA_RECURSOS: 'Explorar recursos',
      HISTORICO_RESERVAS: 'Minhas reservas',
      ANALISAR_RESERVAS: 'Analisar solicitações',
      GESTAO_USUARIOS: 'Gestão de usuários',
      GESTAO_LABORATORIOS: 'Laboratórios',
      GESTAO_EQUIPAMENTOS: 'Equipamentos',
      GESTAO_PROBLEMAS: 'Relatos de problemas',
      CONFIGURACOES: 'Configurações',
      MEU_PERFIL: 'Meu perfil',
      DASHBOARD_ADMIN: 'Dashboard',
      AUDITORIA: 'Auditoria',
    }[telaAtiva] || 'Acessum';
    const avatarUrl = user.avatar_url
      ? new URL(user.avatar_url, api.defaults.baseURL).toString()
      : '';

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
            <span className="brand-mark"><FlaskConical size={21} aria-hidden="true" /></span>
            <span className="brand-name">acessum<span>.</span></span>
          </button>

          <div className="sidebar-section-label">Workspace</div>
          <div className="sidebar-nav-container">
            <nav className="sidebar-nav" aria-label="Navegação principal">
              {navItem('MENU', '⌂', user.perfil === 'ALUNO' ? 'Dashboard' : 'Visão geral')}
              {['ALUNO', 'PROFESSOR'].includes(user.perfil) && navegacaoAluno.map(item => (
                navItem(item.tela, item.icon, item.label)
              ))}
              {user.perfil === 'PROFESSOR' && navItem('ANALISAR_RESERVAS', '✓', 'Solicitações')}
              {user.perfil === 'ADMINISTRADOR' && (
                <>
                  <div className="sidebar-section-label sidebar-section-spaced">Administração</div>
                  {navItem('DASHBOARD_ADMIN', '▥', 'Dashboard')}
                  {navItem('AUDITORIA', '▤', 'Auditoria')}
                  {navItem('GESTAO_USUARIOS', '♙', 'Usuários')}
                  {navItem('GESTAO_LABORATORIOS', '⌂', 'Laboratórios')}
                  {navItem('GESTAO_EQUIPAMENTOS', '▦', 'Equipamentos')}
                  {navItem('GESTAO_PROBLEMAS', '△', 'Relatos de problemas')}
                </>
              )}
            </nav>
          </div>

        </aside>

        <div className="app-workspace">
          <header className="topbar">
            <div>
              <span className="topbar-eyebrow">Acessum / Workspace</span>
              <h1>{nomeTela}</h1>
            </div>
            <div className="topbar-profile">
              <SininhoNotificacoes />
              <span className={`status-indicator${user.status === 'SUSPENSO' ? ' is-suspended' : ''}`} />
              <span>{user.status === 'SUSPENSO' ? 'Conta suspensa' : 'Sessão ativa'}</span>
              <div className="user-menu" ref={menuUsuarioRef}>
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() => setMenuUsuarioAberto(atual => !atual)}
                  aria-expanded={menuUsuarioAberto}
                  aria-haspopup="menu"
                  aria-label={`Menu do usuário ${user.nome}`}
                >
                  {avatarUrl ? (
                    <img className="topbar-avatar" src={avatarUrl} alt="" />
                  ) : (
                    <span className="topbar-avatar" aria-hidden="true">{user.nome?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                  <span className="user-menu-copy">
                    <strong>{user.nome}</strong>
                    <small className="user-role-badge">{user.perfil}</small>
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {menuUsuarioAberto && (
                  <div className="user-menu-dropdown" role="menu" aria-label="Menu do usuário">
                    <button type="button" role="menuitem" onClick={() => { setTelaAtiva('MEU_PERFIL'); setMenuUsuarioAberto(false); }}>
                      <UserRound size={17} aria-hidden="true" /> Meu perfil
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setTelaAtiva('CONFIGURACOES'); setMenuUsuarioAberto(false); }}>
                      <Settings size={17} aria-hidden="true" /> Configurações
                    </button>
                    <button type="button" role="menuitem" onClick={handleLogout}>
                      <LogOut size={17} aria-hidden="true" /> Sair do sistema
                    </button>
                  </div>
                )}
              </div>
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
            {telaAtiva === 'DASHBOARD_ADMIN' && user.perfil === 'ADMINISTRADOR' && (
              <Suspense fallback={<LoadingSpinner label="Carregando dashboard..." />}>
                <DashboardAdmin voltar={() => setTelaAtiva('MENU')} />
              </Suspense>
            )}
            {telaAtiva === 'AUDITORIA' && user.perfil === 'ADMINISTRADOR' && (
              <Auditoria voltar={() => setTelaAtiva('MENU')} />
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
            {telaAtiva === 'CONFIGURACOES' && (
              <Configuracoes voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtiva === 'MEU_PERFIL' && (
              <MeuPerfil voltar={() => setTelaAtiva('MENU')} />
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
                    <span className="graphic-core"><FlaskConical size={30} aria-hidden="true" /></span>
                  </div>
                </div>

                <div className="section-heading">
                  <div>
                    <span className="eyebrow">ATALHOS</span>
                    <h2>Acesse as suas tarefas</h2>
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
          <span className="brand-mark"><FlaskConical size={21} aria-hidden="true" /></span>
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
          <div className="password-input-wrap">
            <input
              id="login-password"
              type={senhaVisivel ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button type="button" className="password-visibility-toggle" onClick={() => setSenhaVisivel(atual => !atual)} aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}>
              {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
          <button type="submit" className="button-primary login-submit" disabled={entrando}>
            {entrando ? <LoadingSpinner label="Entrando..." inline /> : 'Entrar na plataforma'}
          </button>
        </form>
        <button type="button" className="forgot-password-link" onClick={handleEsqueciSenha} disabled={solicitandoReset}>
          {solicitandoReset ? 'Enviando solicitação...' : 'Esqueci minha senha'}
        </button>
        {resetSolicitado && <p className="feedback feedback-success" role="status">Se houver uma conta ativa para este e-mail, o Administrador receberá a solicitação.</p>}
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
