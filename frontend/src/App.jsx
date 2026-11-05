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
import FavoritosProfessor from './FavoritosProfessor';
import SininhoNotificacoes from './SininhoNotificacoes';
import Auditoria from './Auditoria';
import DashboardAluno from './DashboardAluno';
import { formatarPerfil } from './utils/formatarStatus';
import { mascararCpf, mascararRg } from './utils/mascaras';
import Avatar from './components/Avatar';

const DashboardAdmin = lazy(() => import('./DashboardAdmin.jsx'));

const navegacaoAluno = [
  { tela: 'CONSULTA_RECURSOS', icon: '⌕', label: 'Explorar recursos' },
  { tela: 'HISTORICO_RESERVAS', icon: '▤', label: 'Minhas reservas' },
];

export default function App() {
  const { user, login, logout, loading, api, atualizarUsuario } = useContext(AuthContext);
  const { modoEscuro, alternarModoEscuro } = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [novoPinPrimeiroAcesso, setNovoPinPrimeiroAcesso] = useState('');
  const [confirmarPinPrimeiroAcesso, setConfirmarPinPrimeiroAcesso] = useState('');
  const [erroPinPrimeiroAcesso, setErroPinPrimeiroAcesso] = useState('');
  const [salvandoPinPrimeiroAcesso, setSalvandoPinPrimeiroAcesso] = useState(false);
  const [etapaReset, setEtapaReset] = useState('login');
  const [dadosReset, setDadosReset] = useState({
    email: '',
    cpf: '',
    rg: '',
    pin: '',
    nova_senha: '',
    confirmar_senha: '',
  });
  const [tokenReset, setTokenReset] = useState('');
  const [resetando, setResetando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemAjudaReset, setMensagemAjudaReset] = useState('');
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0);
  const [erroSolicitacoesPendentes, setErroSolicitacoesPendentes] = useState('');
  const [telaAtiva, setTelaAtiva] = useState('MENU'); // Controle de qual tela mostrar
  const menuUsuarioRef = useRef(null);
  const acionadorMenuUsuarioRef = useRef(null);

  useEffect(() => {
    if (user) {
      setTelaAtiva('MENU');
      setMenuUsuarioAberto(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!menuUsuarioAberto) return undefined;

    const fecharAoClicarFora = (evento) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(evento.target)) {
        setMenuUsuarioAberto(false);
      }
    };

    const fecharComEscape = (evento) => {
      if (evento.key === 'Escape') {
        setMenuUsuarioAberto(false);
        acionadorMenuUsuarioRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [menuUsuarioAberto]);

  useEffect(() => {
    if (user?.perfil !== 'PROFESSOR') {
      setSolicitacoesPendentes(0);
      setErroSolicitacoesPendentes('');
      return undefined;
    }

    let ativa = true;
    const carregarSolicitacoesPendentes = async () => {
      try {
        const resposta = await api.get('/api/reservas/pendentes');
        if (ativa) {
          setSolicitacoesPendentes(resposta.data.length);
          setErroSolicitacoesPendentes('');
        }
      } catch {
        if (ativa) {
          setErroSolicitacoesPendentes('Não foi possível verificar as solicitações pendentes.');
        }
      }
    };

    carregarSolicitacoesPendentes();
    const intervalo = window.setInterval(carregarSolicitacoesPendentes, 30_000);
    window.addEventListener('focus', carregarSolicitacoesPendentes);
    return () => {
      ativa = false;
      window.clearInterval(intervalo);
      window.removeEventListener('focus', carregarSolicitacoesPendentes);
    };
  }, [api, user?.perfil, telaAtiva]);

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner label="Carregando" large visuallyHiddenLabel />
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');
    setEntrando(true);
    try {
      const result = await login(email, senha);
      if (!result.success) setErro(result.message);
    } finally {
      setEntrando(false);
    }
  };

  const handleEsqueciSenha = () => {
    setErro('');
    setMensagemSucesso('');
    setDadosReset({
      email: email.trim(),
      cpf: '',
      rg: '',
      pin: '',
      nova_senha: '',
      confirmar_senha: '',
    });
    setMensagemAjudaReset('');
    setEtapaReset('dados');
  };

  const atualizarDadosReset = (campo, valor) => {
    setDadosReset(atual => ({ ...atual, [campo]: valor }));
  };

  const handleValidarDadosReset = async (e) => {
    e.preventDefault();
    setErro('');
    setResetando(true);
    try {
      const resposta = await api.post('/api/auth/validar-dados-reset', {
        email: dadosReset.email,
        cpf: dadosReset.cpf,
        rg: dadosReset.rg,
        pin: dadosReset.pin,
      });
      setTokenReset(resposta.data.token);
      setEtapaReset('senha');
    } catch (falha) {
      const detalhe = falha.response?.data?.detail;
      setErro(typeof detalhe === 'string'
        ? detalhe
        : 'Não foi possível validar os dados informados. Verifique os formatos e tente novamente.');
    } finally {
      setResetando(false);
    }
  };

  const handleSolicitarAjudaReset = async () => {
    setErro('');
    setMensagemAjudaReset('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dadosReset.email.trim())) {
      setErro('Informe um e-mail válido para solicitar ajuda.');
      return;
    }

    setResetando(true);
    try {
      const resposta = await api.post('/api/auth/esqueci-senha', {
        email: dadosReset.email.trim(),
      });
      setMensagemAjudaReset(resposta.data.mensagem);
    } catch (falha) {
      const detalhe = falha.response?.data?.detail;
      setErro(typeof detalhe === 'string'
        ? detalhe
        : 'Não foi possível registrar a solicitação. Tente novamente.');
    } finally {
      setResetando(false);
    }
  };

  const requisitosSenha = [
    { texto: 'Pelo menos 8 caracteres', valida: dadosReset.nova_senha.length >= 8 },
    { texto: 'Uma letra maiúscula (A-Z)', valida: /[A-Z]/.test(dadosReset.nova_senha) },
    { texto: 'Uma letra minúscula (a-z)', valida: /[a-z]/.test(dadosReset.nova_senha) },
    { texto: 'Um número (0-9)', valida: /[0-9]/.test(dadosReset.nova_senha) },
    { texto: 'Um caractere especial', valida: /[^A-Za-z0-9\s]/.test(dadosReset.nova_senha) },
    {
      texto: 'No máximo 72 bytes',
      valida: new TextEncoder().encode(dadosReset.nova_senha).length <= 72,
    },
  ];

  const handleRedefinirSenha = async (e) => {
    e.preventDefault();
    setErro('');
    if (!requisitosSenha.every(requisito => requisito.valida)) {
      setErro('A nova senha ainda não atende a todos os requisitos.');
      return;
    }
    if (dadosReset.nova_senha !== dadosReset.confirmar_senha) {
      setErro('A confirmação da senha não corresponde.');
      return;
    }

    setResetando(true);
    try {
      const resposta = await api.post('/api/auth/redefinir-senha', {
        token: tokenReset,
        nova_senha: dadosReset.nova_senha,
      });
      setMensagemSucesso(resposta.data.mensagem || 'Senha redefinida com sucesso.');
      setEmail(dadosReset.email);
      setSenha('');
      setTokenReset('');
      setErro('');
      setEtapaReset('login');
      setDadosReset({
        email: '',
        cpf: '',
        rg: '',
        pin: '',
        nova_senha: '',
        confirmar_senha: '',
      });
    } catch (falha) {
      if (falha.response?.status === 400) {
        setTokenReset('');
        setEtapaReset('dados');
        setDadosReset(atual => ({
          ...atual,
          nova_senha: '',
          confirmar_senha: '',
        }));
        setErro('A validação expirou. Confirme seus dados novamente.');
      } else {
        const detalhe = falha.response?.data?.detail;
        setErro(typeof detalhe === 'string'
          ? detalhe
          : 'Não foi possível redefinir a senha. Tente novamente.');
      }
    } finally {
      setResetando(false);
    }
  };

  const voltarAoLogin = () => {
    setEtapaReset('login');
    setTokenReset('');
    setErro('');
    setDadosReset({
      email: '',
      cpf: '',
      rg: '',
      pin: '',
      nova_senha: '',
      confirmar_senha: '',
    });
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
    if (user.pin_definido === false) {
      const pinValido = /^\d{6}$/.test(novoPinPrimeiroAcesso);
      const confirmacaoValida = pinValido && novoPinPrimeiroAcesso === confirmarPinPrimeiroAcesso;

      const salvarPinPrimeiroAcesso = async (evento) => {
        evento.preventDefault();
        setErroPinPrimeiroAcesso('');
        if (!pinValido || !confirmacaoValida) {
          setErroPinPrimeiroAcesso('Informe um PIN de 6 dígitos e confirme-o corretamente.');
          return;
        }

        setSalvandoPinPrimeiroAcesso(true);
        try {
          await api.put('/api/perfil/pin', {
            novo_pin: novoPinPrimeiroAcesso,
            confirmar_pin: confirmarPinPrimeiroAcesso,
          });
          atualizarUsuario({ pin_definido: true, pin_configurado: true });
          setNovoPinPrimeiroAcesso('');
          setConfirmarPinPrimeiroAcesso('');
        } catch (falha) {
          const detalhe = falha.response?.data?.detail;
          setErroPinPrimeiroAcesso(typeof detalhe === 'string'
            ? detalhe
            : 'Não foi possível cadastrar o PIN. Tente novamente.');
        } finally {
          setSalvandoPinPrimeiroAcesso(false);
        }
      };

      return (
        <main className="pin-onboarding-page">
          <section className="pin-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="pin-onboarding-title">
            <div className="pin-onboarding-icon" aria-hidden="true"><LockKeyhole size={26} /></div>
            <span className="eyebrow">PRIMEIRO ACESSO</span>
            <h1 id="pin-onboarding-title">Bem-vindo ao Acessum!</h1>
            <p>Cadastre seu PIN de Segurança para concluir a configuração da sua conta.</p>
            {erroPinPrimeiroAcesso && (
              <p className="feedback feedback-error" role="alert">{erroPinPrimeiroAcesso}</p>
            )}
            <form className="pin-onboarding-form" onSubmit={salvarPinPrimeiroAcesso}>
              <label htmlFor="first-access-pin">PIN de Segurança (6 dígitos)</label>
              <input
                id="first-access-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="••••••"
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
                value={novoPinPrimeiroAcesso}
                aria-invalid={Boolean(novoPinPrimeiroAcesso && !pinValido)}
                onChange={evento => setNovoPinPrimeiroAcesso(
                  evento.target.value.replace(/\D/g, '').slice(0, 6),
                )}
              />
              <span className={`pin-onboarding-hint${pinValido ? ' is-valid' : ''}`} aria-live="polite">
                {pinValido ? 'PIN válido.' : 'O PIN deve conter exatamente 6 números.'}
              </span>
              <label htmlFor="confirm-first-access-pin">Confirme o PIN</label>
              <input
                id="confirm-first-access-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="••••••"
                maxLength={6}
                pattern="\d{6}"
                required
                value={confirmarPinPrimeiroAcesso}
                aria-invalid={Boolean(confirmarPinPrimeiroAcesso && !confirmacaoValida)}
                onChange={evento => setConfirmarPinPrimeiroAcesso(
                  evento.target.value.replace(/\D/g, '').slice(0, 6),
                )}
              />
              <span className={`pin-onboarding-hint${confirmacaoValida ? ' is-valid' : ''}`} aria-live="polite">
                {confirmacaoValida
                  ? 'Os PINs coincidem.'
                  : 'Digite novamente o mesmo PIN de 6 dígitos.'}
              </span>
              <button
                type="submit"
                className="button-primary pin-onboarding-submit"
                disabled={!confirmacaoValida || salvandoPinPrimeiroAcesso}
                aria-busy={salvandoPinPrimeiroAcesso}
              >
                {salvandoPinPrimeiroAcesso
                  ? <LoadingSpinner label="Salvando PIN..." inline />
                  : 'Cadastrar PIN e continuar'}
              </button>
            </form>
          </section>
        </main>
      );
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
          <nav className="sidebar-nav" aria-label="Navegação principal">
            {navItem('MENU', '⌂', user.perfil === 'ALUNO' ? 'Dashboard' : 'Visão geral')}
            {['ALUNO', 'PROFESSOR'].includes(user.perfil) && navegacaoAluno.map(item => (
              navItem(item.tela, item.icon, item.label)
            ))}
            {user.perfil === 'PROFESSOR' && (
              <button
                type="button"
                className={`sidebar-link${telaAtiva === 'ANALISAR_RESERVAS' ? ' is-active' : ''}`}
                onClick={() => setTelaAtiva('ANALISAR_RESERVAS')}
                aria-label={`Solicitações${solicitacoesPendentes ? `, ${solicitacoesPendentes} pendentes` : ''}`}
                title={erroSolicitacoesPendentes || (solicitacoesPendentes ? `${solicitacoesPendentes} solicitações pendentes` : 'Solicitações')}
              >
                <span className="sidebar-icon" aria-hidden="true">✓</span>
                <span>Solicitações</span>
                {solicitacoesPendentes > 0 && (
                  <span className="sidebar-pending-dot" aria-hidden="true" />
                )}
                {erroSolicitacoesPendentes && (
                  <span className="visually-hidden-label" role="status">{erroSolicitacoesPendentes}</span>
                )}
              </button>
            )}
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
                  ref={acionadorMenuUsuarioRef}
                  className="user-menu-trigger"
                  onClick={() => setMenuUsuarioAberto(atual => !atual)}
                  aria-expanded={menuUsuarioAberto}
                  aria-haspopup="menu"
                  aria-label={`Menu do usuário ${user.nome}`}
                >
                  <Avatar
                    className="topbar-avatar"
                    nome={user.nome}
                    src={user.avatar_url}
                    baseUrl={api.defaults.baseURL}
                  />
                  <span className="user-menu-copy"><strong>{user.nome}</strong><small>{formatarPerfil(user.perfil)}</small></span>
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
              <AnalisarReservas
                voltar={() => setTelaAtiva('MENU')}
                onPendentesChange={setSolicitacoesPendentes}
              />
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

            {telaAtiva === 'MENU' && user.perfil === 'ALUNO' && (
              <DashboardAluno
                explorarRecursos={() => setTelaAtiva('CONSULTA_RECURSOS')}
                verReservas={() => setTelaAtiva('HISTORICO_RESERVAS')}
              />
            )}

            {telaAtiva === 'MENU' && user.perfil !== 'ALUNO' && (
              <section className="dashboard-view content-page">
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
                    <h2>Acesse suas tarefas</h2>
                  </div>
                  <span className="profile-pill">{formatarPerfil(user.perfil)}</span>
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
                        <span className="dashboard-card-description">Acompanhe pedidos, check-in e uso em andamento.</span>
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
                {user.perfil === 'PROFESSOR' && (
                  <FavoritosProfessor
                    explorarRecursos={() => setTelaAtiva('CONSULTA_RECURSOS')}
                  />
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <main className="login-page">
      <button
        type="button"
        className="login-theme-toggle"
        onClick={alternarModoEscuro}
        aria-pressed={modoEscuro}
        aria-label={modoEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={modoEscuro ? 'Tema escuro' : 'Tema claro'}
      >
        {modoEscuro ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        <span>{modoEscuro ? 'Escuro' : 'Claro'}</span>
      </button>
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark"><FlaskConical size={21} aria-hidden="true" /></span>
          <span className="brand-name">acessum<span>.</span></span>
        </div>
        {etapaReset === 'login' ? (
          <>
            <span className="eyebrow">GESTÃO DE LABORATÓRIOS</span>
            <h1>Bem-vindo de volta</h1>
            <p className="login-description">Entre com sua conta para acessar os espaços e as reservas.</p>
            {erro && <p className="feedback feedback-error" role="alert">{typeof erro === 'string' ? erro : 'Erro de validação no login. Verifique os dados.'}</p>}
            {mensagemSucesso && <p className="feedback feedback-success" role="status">{mensagemSucesso}</p>}
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
            <button type="button" className="forgot-password-link" onClick={handleEsqueciSenha}>
              ESQUECI A SENHA
            </button>
            <p className="login-footnote">Acesso seguro para a comunidade Acessum.</p>
          </>
        ) : (
          <>
            <button type="button" className="reset-back-link" onClick={voltarAoLogin}>
              Voltar ao login
            </button>
            <span className="eyebrow">RECUPERAÇÃO DE ACESSO</span>
            <h1>{etapaReset === 'dados' ? 'Confirme seus dados' : 'Crie uma nova senha'}</h1>
            <p className="login-description">
              {etapaReset === 'dados'
                ? 'Informe os dados cadastrados para validar sua identidade.'
                : 'Escolha uma senha segura para acessar sua conta.'}
            </p>
            {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
            {etapaReset === 'dados' ? (
              <form onSubmit={handleValidarDadosReset} className="login-form reset-form">
                <label htmlFor="reset-email">E-mail</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={dadosReset.email}
                  onChange={(e) => atualizarDadosReset('email', e.target.value)}
                />
                <label htmlFor="reset-cpf">CPF</label>
                <input
                  id="reset-cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  value={dadosReset.cpf}
                  onChange={(e) => atualizarDadosReset('cpf', mascararCpf(e.target.value))}
                />
                <label htmlFor="reset-rg">RG</label>
                <input
                  id="reset-rg"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="00.000.000-X"
                  maxLength={12}
                  required
                  value={dadosReset.rg}
                  onChange={(e) => atualizarDadosReset('rg', mascararRg(e.target.value))}
                />
                <label htmlFor="reset-pin">PIN de Segurança (6 dígitos)</label>
                <input
                  id="reset-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="••••••"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  value={dadosReset.pin}
                  aria-invalid={Boolean(dadosReset.pin && !/^\d{6}$/.test(dadosReset.pin))}
                  onChange={(e) => atualizarDadosReset('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <p className={`pin-format-hint${/^\d{6}$/.test(dadosReset.pin) ? ' is-valid' : ''}`} aria-live="polite">
                  {/^\d{6}$/.test(dadosReset.pin)
                    ? 'PIN válido.'
                    : 'Informe exatamente 6 números.'}
                </p>
                <button type="submit" className="button-primary login-submit" disabled={resetando}>
                  {resetando ? <LoadingSpinner label="Validando..." inline /> : 'Validar dados'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRedefinirSenha} className="login-form reset-form">
                <label htmlFor="reset-new-password">Nova senha</label>
                <input
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={dadosReset.nova_senha}
                  onChange={(e) => atualizarDadosReset('nova_senha', e.target.value)}
                />
                <ul className="password-requirements" aria-live="polite">
                  {requisitosSenha.map(requisito => (
                    <li key={requisito.texto} className={requisito.valida ? 'is-valid' : ''}>
                      <span aria-hidden="true">{requisito.valida ? '✓' : '•'}</span>
                      {requisito.texto}
                    </li>
                  ))}
                </ul>
                <label htmlFor="reset-confirm-password">Confirme a nova senha</label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(dadosReset.confirmar_senha && dadosReset.nova_senha !== dadosReset.confirmar_senha)}
                  value={dadosReset.confirmar_senha}
                  onChange={(e) => atualizarDadosReset('confirmar_senha', e.target.value)}
                />
                <button type="submit" className="button-primary login-submit" disabled={resetando}>
                  {resetando ? <LoadingSpinner label="Salvando..." inline /> : 'Redefinir senha'}
                </button>
              </form>
            )}
            {etapaReset === 'dados' && (
              <div className="reset-admin-fallback">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={handleSolicitarAjudaReset}
                  disabled={resetando}
                >
                  {resetando ? 'Enviando solicitação...' : 'Não tenho acesso ao PIN — solicitar ajuda'}
                </button>
                {mensagemAjudaReset && (
                  <p className="feedback feedback-success" role="status">{mensagemAjudaReset}</p>
                )}
              </div>
            )}
          </>
        )}
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
