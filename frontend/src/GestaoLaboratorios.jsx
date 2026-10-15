import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

export default function GestaoLaboratorios({ voltar }) {
  const { api } = useContext(AuthContext);
  const [laboratorios, setLaboratorios] = useState([]);
  const [form, setForm] = useState({ nome: '', capacidade: '' });
  const [erro, setErro] = useState('');

  const carregarLaboratorios = async () => {
    try {
      const response = await api.get('/api/laboratorios/');
      setLaboratorios(response.data);
    } catch (err) {
      setErro('Erro ao carregar laboratórios.');
    }
  };

  useEffect(() => {
    carregarLaboratorios();
  }, []);

  const criarLaboratorio = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/laboratorios/', {
        nome: form.nome,
        capacidade: parseInt(form.capacidade)
      });
      setForm({ nome: '', capacidade: '' });
      setErro('');
      carregarLaboratorios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar laboratório.');
    }
  };

  const alternarStatus = async (id) => {
    try {
      await api.patch(`/api/laboratorios/${id}/status`);
      carregarLaboratorios();
    } catch (err) {
      setErro('Erro ao alterar status do laboratório.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <button onClick={voltar} style={{ marginBottom: '20px' }}>⬅ Voltar ao Menu</button>
      
      <h2>Gestão de Laboratórios</h2>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {/* FORMULÁRIO DE CADASTRO */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h3>Cadastrar Novo Laboratório</h3>
        <form onSubmit={criarLaboratorio} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            placeholder="Nome do Laboratório (ex: Lab Info 1)" 
            value={form.nome} 
            onChange={e => setForm({...form, nome: e.target.value})} 
            required 
            style={{ padding: '8px', minWidth: '250px' }}
          />
          <input 
            placeholder="Capacidade (Nº de máquinas/lugares)" 
            type="number" 
            min="1"
            value={form.capacidade} 
            onChange={e => setForm({...form, capacidade: e.target.value})} 
            required 
            style={{ padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 15px' }}>Salvar</button>
        </form>
      </div>

      {/* LISTA DE LABORATÓRIOS */}
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th style={{ padding: '8px' }}>Nome</th>
            <th>Capacidade</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {laboratorios.length === 0 ? (
            <tr><td colSpan="4" style={{ padding: '8px', textAlign: 'center' }}>Nenhum laboratório cadastrado.</td></tr>
          ) : (
            laboratorios.map(lab => (
              <tr key={lab.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{lab.nome}</td>
                <td>{lab.capacidade} lugares</td>
                <td style={{ color: lab.status === 'ATIVO' ? 'green' : 'red', fontWeight: 'bold' }}>
                  {lab.status}
                </td>
                <td>
                  <button 
                    onClick={() => alternarStatus(lab.id)} 
                    style={{ 
                      padding: '5px 10px', 
                      cursor: 'pointer',
                      backgroundColor: lab.status === 'ATIVO' ? '#ffcccc' : '#ccffcc',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    {lab.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}