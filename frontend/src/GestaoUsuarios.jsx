import React, { useState, useEffect, useContext } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

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
    setSalvando(true);
    try {
      await api.post('/api/usuarios/', form);
      setForm({ nome: '', email: '', cpf: '', rg: '', data_nascimento: '', perfil: 'ALUNO', senha: '' });
      setSucesso('Usuário cadastrado com sucesso.');
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar usuário.');
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
      setSucesso(`Status atualizado para ${response.data.novo_status}.`);
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao alterar status do usuário.');
    } finally {
      setUsuarioEmAtualizacao(null);
    }
  };

  return (
    <section style={{ marginTop: '20px', color: '#333333' }}>
      <button
        type="button"
        onClick={voltar}
        style={{ marginBottom: '20px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0e0e0', cursor: 'pointer' }}
      >
        ← Voltar ao Menu
      </button>

      <h2>Gestão de Usuários</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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
              onChange={e => setForm({ ...form, cpf: e.target.value })}
              maxLength={14}
              required
              style={estiloInput}
            />
          </label>
          <label>
            RG
            <input
              name="rg"
              autoComplete="off"
              value={form.rg}
              onChange={e => setForm({ ...form, rg: e.target.value })}
              maxLength={30}
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
            <small>A senha deve ter ao menos 12 caracteres, com letras e números.</small>
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
            {salvando ? <LoadingSpinner label="A guardar..." inline /> : 'Cadastrar usuário'}
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
          <LoadingSpinner label="A carregar usuários..." />
        ) : usuarios.length === 0 ? (
          <p>Nenhum usuário cadastrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {usuarios.map(usuario => (
              <article
                key={usuario.id}
                style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >
                <h4 style={{ margin: '0 0 8px' }}>{usuario.nome}</h4>
                <p style={{ margin: '4px 0' }}>{usuario.email}</p>
                <p style={{ margin: '4px 0' }}>Perfil: {usuario.perfil}</p>
                <p style={{ margin: '4px 0 12px', color: usuario.status === 'ATIVO' ? '#28a745' : usuario.status === 'SUSPENSO' ? '#a96b0a' : '#dc3545', fontWeight: 'bold' }}>
                  Status: {usuario.status}
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
                    ? <LoadingSpinner label="A atualizar..." inline />
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