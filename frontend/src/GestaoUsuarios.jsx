import React, { useState, useEffect, useContext } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import { formatarPerfil, formatarStatus } from './utils/formatarStatus';
import { mascararCpf, mascararRg } from './utils/mascaras';

const ROTULOS_CAMPOS_CADASTRO = {
  nome: 'Nome',
  email: 'E-mail',
  cpf: 'CPF',
  rg: 'RG',
  data_nascimento: 'Data de nascimento',
  senha: 'Senha',
  perfil: 'Perfil',
};

function mensagemErroCadastro(err) {
  const detalhe = err.response?.data?.detail;
  if (typeof detalhe === 'string') return detalhe;
  if (Array.isArray(detalhe)) {
    const mensagens = detalhe.map(item => {
      const campo = item.loc?.filter(parte => parte !== 'body').at(-1);
      const rotulo = ROTULOS_CAMPOS_CADASTRO[campo] || 'Cadastro';
      return `${rotulo}: ${item.msg}`;
    });
    return mensagens.join(' ');
  }
  return 'Erro ao criar usuário.';
}

export default function GestaoUsuarios({ voltar }) {
  const { api } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', rg: '', data_nascimento: '', perfil: 'ALUNO', senha: '' });
  const [solicitacoesReset, setSolicitacoesReset] = useState([]);
  const [resetandoSolicitacao, setResetandoSolicitacao] = useState(null);
  const [senhaTemporaria, setSenhaTemporaria] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [usuarioEmAtualizacao, setUsuarioEmAtualizacao] = useState(null);
  const requisitosSenhaCadastro = [
    { texto: 'Ao menos 12 caracteres', valida: form.senha.length >= 12 },
    { texto: 'Uma letra maiúscula', valida: /[A-Z]/.test(form.senha) },
    { texto: 'Uma letra minúscula', valida: /[a-z]/.test(form.senha) },
    { texto: 'Um número', valida: /[0-9]/.test(form.senha) },
    { texto: 'Um caractere especial', valida: /[^A-Za-z0-9\s]/.test(form.senha) },
  ];

  const carregarUsuarios = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/api/usuarios/');
      setUsuarios(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar usuários.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarSolicitacoesReset = async () => {
    try {
      const resposta = await api.get('/api/notificacoes-conta');
      setSolicitacoesReset(resposta.data.solicitacoes);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar solicitações de redefinição.');
    }
  };

  useEffect(() => {
    carregarUsuarios();
    carregarSolicitacoesReset();
  }, [api]);

  const criarUsuario = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (!requisitosSenhaCadastro.every(requisito => requisito.valida)) {
      setErro('A senha deve ter ao menos 12 caracteres, incluindo maiúscula, minúscula, número e caractere especial.');
      return;
    }

    setSalvando(true);
    try {
      await api.post('/api/usuarios/', {
        ...form,
        nome: form.nome.trim(),
        email: form.email.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        rg: form.rg.replace(/[^0-9a-z]/gi, '').toUpperCase(),
      });
      setForm({ nome: '', email: '', cpf: '', rg: '', data_nascimento: '', perfil: 'ALUNO', senha: '' });
      setSucesso('Usuário cadastrado com sucesso.');
      await carregarUsuarios();
    } catch (err) {
      setErro(mensagemErroCadastro(err));
    } finally {
      setSalvando(false);
    }
  };

  const redefinirSenha = async (solicitacao) => {
    setErro('');
    setSucesso('');
    setSenhaTemporaria('');
    setResetandoSolicitacao(solicitacao.id);
    try {
      const resposta = await api.post(`/api/notificacoes-conta/${solicitacao.id}/redefinir`);
      setSenhaTemporaria(resposta.data.senha_temporaria);
      setSucesso(`Senha temporária gerada para ${solicitacao.solicitante_nome}. Copie e entregue ao usuário por um canal seguro.`);
      await carregarSolicitacoesReset();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível redefinir a senha.');
    } finally {
      setResetandoSolicitacao(null);
    }
  };

  const copiarSenhaTemporaria = async () => {
    try {
      await navigator.clipboard.writeText(senhaTemporaria);
      setSucesso('Senha temporária copiada. Entregue-a ao usuário por um canal seguro.');
    } catch {
      setErro('Não foi possível copiar automaticamente; selecione e copie a senha exibida.');
    }
  };

  const alternarStatus = async (usuario) => {
    const acao = usuario.status === 'INATIVO' ? 'ativar' : 'inativar';
    if (!window.confirm(`Confirma ${acao} o acesso de ${usuario.nome}?`)) return;

    setErro('');
    setSucesso('');
    setUsuarioEmAtualizacao(usuario.id);
    try {
      const response = await api.patch(`/api/usuarios/${usuario.id}/status`);
      setSucesso(`Status atualizado para ${formatarStatus(response.data.novo_status)}.`);
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao alterar status do usuário.');
    } finally {
      setUsuarioEmAtualizacao(null);
    }
  };

  return (
    <section className="content-page" aria-labelledby="users-title">
      <button
        type="button"
        className="content-back-button"
        onClick={voltar}
      >
        ← Voltar ao Menu
      </button>

      <h2 id="users-title">Gestão de Usuários</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      <div className="content-card content-card-muted">
        <h3>Cadastrar novo usuário</h3>
        <form onSubmit={criarUsuario} style={{ display: 'grid', gap: '12px' }}>
          <label>
            Nome
            <input
              name="nome"
              autoComplete="name"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              maxLength={100}
              required
              style={estiloInput}
            />
          </label>
          <label>
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              maxLength={100}
              required
              style={estiloInput}
            />
          </label>
          <label>
            CPF
            <input
              name="cpf"
              inputMode="numeric"
              autoComplete="off"
              value={form.cpf}
              onChange={e => setForm({ ...form, cpf: mascararCpf(e.target.value) })}
              maxLength={14}
              required
              style={estiloInput}
            />
          </label>
          <label>
            RG
            <input
              name="rg"
              inputMode="text"
              autoComplete="off"
              value={form.rg}
              onChange={e => setForm({ ...form, rg: mascararRg(e.target.value) })}
              maxLength={12}
              required
              style={estiloInput}
            />
          </label>
          <label>
            Data de nascimento
            <input
              name="data_nascimento"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.data_nascimento}
              onChange={e => setForm({ ...form, data_nascimento: e.target.value })}
              required
              style={estiloInput}
            />
          </label>
          <label>
            Senha
            <input
              name="senha"
              type="password"
              autoComplete="new-password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              minLength={12}
              maxLength={72}
              required
              style={estiloInput}
            />
            <ul className="registration-password-requirements">
              {requisitosSenhaCadastro.map(requisito => (
                <li className={requisito.valida ? 'is-valid' : ''} key={requisito.texto}>
                  <span aria-hidden="true">{requisito.valida ? '✓' : '○'}</span>
                  {requisito.texto}
                </li>
              ))}
            </ul>
          </label>
          <label>
            Perfil
            <select
              name="perfil"
              value={form.perfil}
              onChange={e => setForm({ ...form, perfil: e.target.value })}
              style={estiloInput}
            >
            <option value="ALUNO">Aluno</option>
            <option value="PROFESSOR">Professor</option>
            <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={salvando}
            aria-busy={salvando}
            style={estiloBotaoPrimario}
          >
            {salvando ? <LoadingSpinner label="Salvando..." inline /> : 'Cadastrar usuário'}
          </button>
        </form>
      </div>

      <section className="password-reset-requests" aria-labelledby="password-reset-title">
        <h3 id="password-reset-title">Solicitações de redefinição de senha</h3>
        {senhaTemporaria && (
          <div className="temporary-password-notice" role="status">
            <label htmlFor="temporary-password-value">Senha temporária, exibida somente agora</label>
            <div>
              <input id="temporary-password-value" value={senhaTemporaria} readOnly />
              <button type="button" onClick={copiarSenhaTemporaria} aria-label="Copiar senha temporária" title="Copiar senha temporária">
                <Copy size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        {solicitacoesReset.length === 0 ? (
          <p>Não há solicitações pendentes.</p>
        ) : (
          <div className="password-reset-list">
            {solicitacoesReset.map(solicitacao => (
              <article key={solicitacao.id}>
                <div>
                  <strong>{solicitacao.solicitante_nome}</strong>
                  <span>{solicitacao.solicitante_email}</span>
                  <small>{new Date(solicitacao.criada_em).toLocaleString('pt-BR')}</small>
                </div>
                <button type="button" onClick={() => redefinirSenha(solicitacao)} disabled={resetandoSolicitacao === solicitacao.id}>
                  {resetandoSolicitacao === solicitacao.id ? <LoadingSpinner label="Gerando..." inline /> : <><KeyRound size={16} aria-hidden="true" /> Redefinir senha</>}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="lista-usuarios-titulo">
        <h3 id="lista-usuarios-titulo">Usuários cadastrados</h3>
        {carregando ? (
          <LoadingSpinner label="Carregando usuários..." />
        ) : usuarios.length === 0 ? (
          <p>Nenhum usuário cadastrado.</p>
        ) : (
          <div className="content-card-list">
            {usuarios.map(usuario => (
              <article key={usuario.id}>
                <div className="management-user-heading">
                  <Avatar
                    className="management-user-avatar"
                    nome={usuario.nome}
                    src={usuario.avatar_url}
                    baseUrl={api.defaults.baseURL}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 8px' }}>{usuario.nome}</h4>
                    <p style={{ margin: '4px 0' }}>{usuario.email}</p>
                  </div>
                </div>
                <p style={{ margin: '4px 0' }}>Perfil: {formatarPerfil(usuario.perfil)}</p>
                <p style={{ margin: '4px 0 12px', color: usuario.status === 'ATIVO' ? '#28a745' : usuario.status === 'SUSPENSO' ? '#a96b0a' : '#dc3545', fontWeight: 'bold' }}>
                  Status: {formatarStatus(usuario.status)}
                  {usuario.suspensao_ate && ` até ${new Date(usuario.suspensao_ate).toLocaleString('pt-BR')}`}
                </p>
                <button
                  type="button"
                  onClick={() => alternarStatus(usuario)}
                  disabled={usuarioEmAtualizacao === usuario.id}
                  aria-busy={usuarioEmAtualizacao === usuario.id}
                  style={{
                    ...estiloBotaoStatus,
                    backgroundColor: usuario.status === 'INATIVO' ? '#28a745' : '#dc3545',
                  }}
                >
                  {usuarioEmAtualizacao === usuario.id
                    ? <LoadingSpinner label="Atualizando..." inline />
                    : usuario.status === 'INATIVO' ? 'Ativar acesso' : 'Inativar acesso'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

const estiloInput = {
  display: 'block',
  boxSizing: 'border-box',
  width: '100%',
  marginTop: '6px',
  padding: '10px',
  border: '1px solid #cccccc',
  borderRadius: '8px',
};

const estiloBotaoPrimario = {
  padding: '10px 14px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const estiloBotaoStatus = {
  padding: '10px 14px',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};