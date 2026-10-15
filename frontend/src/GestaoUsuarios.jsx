import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

export default function GestaoUsuarios({ voltar }) {
  const { api } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'ALUNO', senha: '' });
  const [erro, setErro] = useState('');

  const carregarUsuarios = async () => {
    try {
      const response = await api.get('/api/usuarios/');
      setUsuarios(response.data);
    } catch (err) {
      setErro('Erro ao carregar usuários.');
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const criarUsuario = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/usuarios/', form);
      setForm({ nome: '', email: '', perfil: 'ALUNO', senha: '' }); // Limpa o form
      setErro('');
      carregarUsuarios(); // Atualiza a lista
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar usuário.');
    }
  };

  const alternarStatus = async (id) => {
    try {
      await api.patch(`/api/usuarios/${id}/status`);
      carregarUsuarios(); // Atualiza a lista
    } catch (err) {
      setErro('Erro ao alterar status.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <button onClick={voltar} style={{ marginBottom: '20px' }}>⬅ Voltar ao Menu</button>
      
      <h2>Gestão de Usuários</h2>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {/* FORMULÁRIO DE CADASTRO */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h3>Cadastrar Novo</h3>
        <form onSubmit={criarUsuario} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
          <input placeholder="E-mail" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input placeholder="Senha" type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} required />
          <select value={form.perfil} onChange={e => setForm({...form, perfil: e.target.value})}>
            <option value="ALUNO">Aluno</option>
            <option value="PROFESSOR">Professor</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
          <button type="submit">Salvar</button>
        </form>
      </div>

      {/* LISTA DE USUÁRIOS */}
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th style={{ padding: '8px' }}>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>{u.nome}</td>
              <td>{u.email}</td>
              <td>{u.perfil}</td>
              <td style={{ color: u.status === 'ATIVO' ? 'green' : 'red' }}>{u.status}</td>
              <td>
                <button onClick={() => alternarStatus(u.id)}>
                  {u.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}