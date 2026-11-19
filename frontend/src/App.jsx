import React, { Suspense, lazy, useContext, useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, EyeOff, FlaskConical, LockKeyhole, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
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
import { mascararCPF, mascararRG } from './utils/mascaras';

const DashboardAdmin = lazy(() => import('./DashboardAdmin.jsx'));

const navegacaoAluno = [
  { tela: 'CONSULTA_RECURSOS', icon: '⌕', label: 'Explorar recursos' },
  { tela: 'HISTORICO_RESERVAS', icon: '▤', label: 'Minhas reservas' },
];

const obterTelasPermitidas = (perfil) => [
  'MENU',
  'CONFIGURACOES',
  'MEU_PERFIL',
  ...(['ALUNO', 'PROFESSOR'].includes(perfil)
    ? ['CONSULTA_RECURSOS', 'HISTORICO_RESERVAS']
    : []),
  ...(perfil === 'PROFESSOR' ? ['ANALISAR_RESERVAS'] : []),
  ...(perfil === 'ADMINISTRADOR'
    ? [
      'DASHBOARD_ADMIN',
      'AUDITORIA',
      'GESTAO_USUARIOS',
      'GESTAO_LABORATORIOS',
      'GESTAO_EQUIPAMENTOS',
      'GESTAO_PROBLEMAS',
    ]
    : []),
];

function AlternadorTema() {
  const { tema, alternarTema } = useTheme();
  const nomeTema = {
    light: 'Claro',
    dark: 'Escuro',
    'high-contrast': 'Alto contraste',
  }[tema];
  const proximoTema = {
    light: 'Escuro',
    dark: 'Alto contraste',
    'high-contrast': 'Claro',
  }[tema];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternarTema}
      aria-label={`Tema atual: ${nomeTema}. Ativar ${proximoTema}.`}
      title={`Tema atual: ${nomeTema}`}
    >
      {tema === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
      <span>{nomeTema}</span>
    </button>
  );
}

function CadastroPinObrigatorio({ api, aoSalvar }) {
  const [pin, setPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const campoPinRef = useRef(null);

  useEffect(() => campoPinRef.current?.focus(), []);

  const salvarPin = async (evento) => {
    evento.preventDefault();
    setErro('');
    if (pin.length !== 6 || confirmarPin.length !== 6) {
      setErro('O PIN deve conter exatamente 6 dígitos numéricos.');
      return;
    }
    if (pin !== confirmarPin) {
      setErro('Os PINs informados não são iguais.');
      return;
    }

    setSalvando(true);
    try {
      await api.put('/api/perfil/pin', { pin, confirmar_pin: confirmarPin });
      aoSalvar({ pin_definido: true });
    } catch (falha) {
      const detalhe = falha.response?.data?.detail;
      setErro(Array.isArray(detalhe) ? detalhe.map(item => item.msg).join(' ') : detalhe || 'Não foi possível cadastrar o PIN. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const tratarTecla = (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      evento.stopPropagation();
    }
  };

  return (
    <main className="pin-required-page">
      <section
        className="pin-required-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-required-title"
        onKeyDown={tratarTecla}
      >
        <div className="login-header">
          <div className="login-brand">
            <span className="brand-mark"><FlaskConical size={21} aria-hidden="true" /></span>
            <span className="brand-name">acessum<span>.</span></span>
          </div>
          <AlternadorTema />
        </div>
        <span className="eyebrow">PROTEÇÃO DA CONTA</span>
        <h1 id="pin-required-title">Cadastre seu PIN de segurança</h1>
        <p className="login-description">Antes de acessar o sistema, crie um PIN numérico de 6 dígitos e confirme-o.</p>
        {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
        <form className="pin-required-form" onSubmit={salvarPin}>
          <label htmlFor="pin-security">PIN de segurança</label>
          <input
            ref={campoPinRef}
            id="pin-security"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            aria-required="true"
            value={pin}
            onChange={evento => setPin(evento.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <label htmlFor="pin-security-confirm">Confirmar PIN</label>
          <input
            id="pin-security-confirm"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            aria-required="true"
            value={confirmarPin}
            onChange={evento => setConfirmarPin(evento.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <small>Use exatamente 6 números. O PIN será solicitado para proteger o acesso à sua conta.</small>
          <button type="submit" className="button-primary" disabled={salvando}>
            {salvando ? 'Salvando PIN...' : <><LockKeyhole size={17} aria-hidden="true" /> Salvar PIN e continuar</>}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const { user, login, logout, loading, api, atualizarUsuario } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [modoReset, setModoReset] = useState(false);
  const [etapaReset, setEtapaReset] = useState(1);
  const [emailReset, setEmailReset] = useState('');
  const [cpfReset, setCpfReset] = useState('');
  const [rgReset, setRgReset] = useState('');
  const [pinReset, setPinReset] = useState('');
  const [tokenReset, setTokenReset] = useState('');
  const [novaSenhaReset, setNovaSenhaReset] = useState('');
  const [confirmarSenhaReset, setConfirmarSenhaReset] = useState('');
  const [solicitandoReset, setSolicitandoReset] = useState(false);
  const [resetConcluido, setResetConcluido] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [navegacao, setNavegacao] = useState({ usuarioId: null, tela: 'MENU' });
  const usuarioIdAtual = user?.id ?? null;
  const telaAtiva = navegacao.usuarioId === usuarioIdAtual ? navegacao.tela : 'MENU';
  const setTelaAtiva = (tela) => {
    setNavegacao({ usuarioId: usuarioIdAtual, tela });
  };
  const menuUsuarioRef = useRef(null);

  useEffect(() => {
    const telasPermitidas = user ? obterTelasPermitidas(user.perfil) : [];
    if (
      navegacao.usuarioId !== usuarioIdAtual
      || (user && !telasPermitidas.includes(navegacao.tela))
    ) {
      setNavegacao({ usuarioId: usuarioIdAtual, tela: 'MENU' });
      setMenuUsuarioAberto(false);
    }
  }, [user?.id, user?.perfil, navegacao, usuarioIdAtual, user]);

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

  const iniciarResetSenha = () => {
    setErro('');
    setResetConcluido(false);
    setEmailReset(email);
    setModoReset(true);
    setEtapaReset(1);
  };

  const voltarLogin = () => {
    setModoReset(false);
    setEtapaReset(1);
    setErro('');
    setCpfReset('');
    setRgReset('');
    setTokenReset('');
    setPinReset('');
    setNovaSenhaReset('');
    setConfirmarSenhaReset('');
  };

  const validarDadosReset = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSolicitandoReset(true);
    try {
      const resposta = await api.post('/api/auth/validar-dados-reset', {
        email: emailReset,
        cpf: cpfReset,
        rg: rgReset,
        pin: pinReset,
      });
      setTokenReset(resposta.data.token);
      setEtapaReset(2);
      setCpfReset('');
      setRgReset('');
    } catch (falha) {
      const detalhe = falha.response?.data?.detail;
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível validar os dados informados.');
    } finally {
      setSolicitandoReset(false);
      setPinReset('');
    }
  };

  const redefinirSenha = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSolicitandoReset(true);
    try {
      await api.post('/api/auth/redefinir-senha', {
        token: tokenReset,
        nova_senha: novaSenhaReset,
        confirmar_senha: confirmarSenhaReset,
      });
      setSenha('');
      setEmail(emailReset);
      voltarLogin();
      setResetConcluido(true);
    } catch (falha) {
      const detalhe = falha.response?.data?.detail;
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível redefinir a senha. Verifique os dados.');
    } finally {
      setSolicitandoReset(false);
    }
  };

  const handleLogout = () => {
    // 1. Chama a função de logout do contexto (remove token, altera estado do user)
    setNavegacao({ usuarioId: null, tela: 'MENU' });
    setMenuUsuarioAberto(false);
    logout();

    // 2. Limpa os estados locais do formulário
    setEmail('');
    setSenha('');
    setErro(''); // Opcional, mas recomendado para limpar mensagens de erro antigas
  };

  if (user) {
    if (user.pin_definido === false) {
      return <CadastroPinObrigatorio api={api} aoSalvar={atualizarUsuario} />;
    }

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

    const telasPermitidas = obterTelasPermitidas(user.perfil);
    const telaAtual = telasPermitidas.includes(telaAtiva) ? telaAtiva : 'MENU';
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
    }[telaAtual] || 'Acessum';
    const avatarUrl = user.avatar_url
      ? new URL(user.avatar_url, api.defaults.baseURL).toString()
      : '';

    const navItem = (tela, icon, label) => (
      <button
        key={tela}
        type="button"
        className={`sidebar-link${telaAtual === tela ? ' is-active' : ''}`}
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
              <AlternadorTema />
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
            {telaAtual === 'GESTAO_USUARIOS' && user.perfil === 'ADMINISTRADOR' && (
              <GestaoUsuarios voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'GESTAO_LABORATORIOS' && user.perfil === 'ADMINISTRADOR' && (
              <GestaoLaboratorios voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'GESTAO_EQUIPAMENTOS' && user.perfil === 'ADMINISTRADOR' && (
              <GestaoEquipamentos voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'GESTAO_PROBLEMAS' && user.perfil === 'ADMINISTRADOR' && (
              <GestaoProblemas voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'DASHBOARD_ADMIN' && user.perfil === 'ADMINISTRADOR' && (
              <Suspense fallback={<LoadingSpinner label="Carregando dashboard..." />}>
                <DashboardAdmin voltar={() => setTelaAtiva('MENU')} />
              </Suspense>
            )}
            {telaAtual === 'AUDITORIA' && user.perfil === 'ADMINISTRADOR' && (
              <Auditoria voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'ANALISAR_RESERVAS' && user.perfil === 'PROFESSOR' && (
              <AnalisarReservas voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'HISTORICO_RESERVAS' && ['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
              <HistoricoReservas voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'CONSULTA_RECURSOS' && ['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
              <ConsultaRecursos voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'CONFIGURACOES' && (
              <Configuracoes voltar={() => setTelaAtiva('MENU')} />
            )}
            {telaAtual === 'MEU_PERFIL' && (
              <MeuPerfil voltar={() => setTelaAtiva('MENU')} />
            )}

            {telaAtual === 'MENU' && (
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
        <div className="login-header">
          <div className="login-brand">
            <span className="brand-mark"><FlaskConical size={21} aria-hidden="true" /></span>
            <span className="brand-name">acessum<span>.</span></span>
          </div>
          <AlternadorTema />
        </div>
        <span className="eyebrow">{modoReset ? 'RECUPERAÇÃO DE ACESSO' : 'GESTÃO DE LABORATÓRIOS'}</span>
        <h1>{modoReset ? (etapaReset === 1 ? 'Validação cadastral' : 'Defina uma nova senha') : 'Bem-vindo de volta'}</h1>
        <p className="login-description">
          {modoReset
            ? etapaReset === 1
              ? 'Confirme os quatro dados cadastrados para validar sua identidade.'
              : 'Escolha uma senha segura para recuperar o acesso à sua conta.'
            : 'Entre com a sua conta para aceder aos espaços e reservas.'}
        </p>
        {erro && <p className="feedback feedback-error" role="alert">{typeof erro === 'string' ? erro : 'Erro de validação no login. Verifique os dados.'}</p>}
        {resetConcluido && <p className="feedback feedback-success" role="status">Senha redefinida com sucesso. Faça login com sua nova senha.</p>}
        {modoReset ? (
          etapaReset === 1 ? (
            <form onSubmit={validarDadosReset} className="login-form">
              <label htmlFor="reset-email">E-mail</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={emailReset}
                onChange={evento => setEmailReset(evento.target.value)}
              />
              <label htmlFor="reset-cpf">CPF</label>
              <input
                id="reset-cpf"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                placeholder="000.000.000-00"
                required
                value={cpfReset}
                onChange={evento => setCpfReset(mascararCPF(evento.target.value))}
              />
              <label htmlFor="reset-rg">RG</label>
              <input
                id="reset-rg"
                autoComplete="off"
                maxLength={12}
                placeholder="00.000.000-X"
                required
                value={rgReset}
                onChange={evento => setRgReset(mascararRG(evento.target.value))}
              />
              <label htmlFor="reset-pin">PIN de Segurança</label>
              <input
                id="reset-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                required
                value={pinReset}
                onChange={evento => setPinReset(evento.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button type="submit" className="button-primary login-submit" disabled={solicitandoReset}>
                {solicitandoReset ? <LoadingSpinner label="Validando dados..." inline /> : 'Validar dados'}
              </button>
              <button type="button" className="forgot-password-link" onClick={voltarLogin} disabled={solicitandoReset}>
                Voltar para o login
              </button>
            </form>
          ) : (
            <form onSubmit={redefinirSenha} className="login-form">
              <label htmlFor="reset-new-password">Nova Senha</label>
              <input
                id="reset-new-password"
                type="password"
                autoComplete="new-password"
                required
                value={novaSenhaReset}
                onChange={evento => setNovaSenhaReset(evento.target.value)}
              />
              <ul className="password-requirements" aria-label="Requisitos da nova senha">
                {[
                  ['Pelo menos 8 caracteres', novaSenhaReset.length >= 8],
                  ['Uma letra maiúscula', /\p{Lu}/u.test(novaSenhaReset)],
                  ['Uma letra minúscula', /\p{Ll}/u.test(novaSenhaReset)],
                  ['Um número', /\p{Nd}/u.test(novaSenhaReset)],
                  ['Um caractere especial', /[^\p{L}\p{N}\s]/u.test(novaSenhaReset)],
                ].map(([requisito, atendido]) => (
                  <li key={requisito} className={atendido ? 'is-met' : ''}>
                    <span aria-hidden="true">{atendido ? '✓' : '○'}</span> {requisito}
                  </li>
                ))}
              </ul>
              <label htmlFor="reset-confirm-password">Confirmar Nova Senha</label>
              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmarSenhaReset}
                onChange={evento => setConfirmarSenhaReset(evento.target.value)}
              />
              <button type="submit" className="button-primary login-submit" disabled={solicitandoReset}>
                {solicitandoReset ? <LoadingSpinner label="Redefinindo senha..." inline /> : 'Redefinir senha'}
              </button>
              <button type="button" className="forgot-password-link" onClick={voltarLogin} disabled={solicitandoReset}>
                Voltar para o login
              </button>
            </form>
          )
        ) : (
          <>
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
            <button type="button" className="forgot-password-link" onClick={iniciarResetSenha}>
              Esqueci minha senha
            </button>
          </>
        )}
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
