import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

export default function GestaoUsuarios({ voltar }) {
  const { api } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'ALUNO', senha: '' });
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

  useEffect(() => {
    carregarUsuarios();
  }, [api]);

  const criarUsuario = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await api.post('/api/usuarios/', form);
      setForm({ nome: '', email: '', perfil: 'ALUNO', senha: '' });
      setSucesso('Usuário cadastrado com sucesso.');
      await carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (usuario) => {
    const acao = usuario.status === 'ATIVO' ? 'inativar' : 'ativar';
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
            Senha
            <input
              name="senha"
              type="password"
              autoComplete="new-password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              maxLength={72}
              required
              style={estiloInput}
            />
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
            style={estiloBotaoPrimario}
          >
            {salvando ? 'A guardar...' : 'Cadastrar usuário'}
          </button>
        </form>
      </div>

      <section aria-labelledby="lista-usuarios-titulo">
        <h3 id="lista-usuarios-titulo">Usuários cadastrados</h3>
        {carregando ? (
          <p role="status">A carregar usuários...</p>
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
                <p style={{ margin: '4px 0 12px', color: usuario.status === 'ATIVO' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                  Status: {usuario.status}
                </p>
                <button
                  type="button"
                  onClick={() => alternarStatus(usuario)}
                  disabled={usuarioEmAtualizacao === usuario.id}
                  style={{
                    ...estiloBotaoStatus,
                    backgroundColor: usuario.status === 'ATIVO' ? '#dc3545' : '#28a745',
                  }}
                >
                  {usuarioEmAtualizacao === usuario.id
                    ? 'A atualizar...'
                    : usuario.status === 'ATIVO' ? 'Inativar acesso' : 'Ativar acesso'}
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