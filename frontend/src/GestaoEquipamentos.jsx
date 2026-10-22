import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

export default function GestaoEquipamentos({ voltar }) {
  const { api } = useContext(AuthContext);
  const [equipamentos, setEquipamentos] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [form, setForm] = useState({ nome: '', descricao: '', laboratorio_id: '' });
  const [erro, setErro] = useState('');

  // Carrega tanto os equipamentos quanto os laboratórios para o select
  const carregarDados = async () => {
    try {
      const [resEquipamentos, resLaboratorios] = await Promise.all([
        api.get('/api/equipamentos/'),
        api.get('/api/laboratorios/')
      ]);
      setEquipamentos(resEquipamentos.data);
      // Filtramos apenas laboratórios ativos para não cadastrar equipamento num lab inativo
      setLaboratorios(resLaboratorios.data.filter(lab => lab.status === 'ATIVO'));
    } catch (err) {
      setErro('Erro ao carregar os dados.');
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const criarEquipamento = async (e) => {
    e.preventDefault();
    if (!form.laboratorio_id) {
      setErro('Por favor, selecione um laboratório.');
      return;
    }

    try {
      await api.post('/api/equipamentos/', {
        nome: form.nome,
        descricao: form.descricao,
        laboratorio_id: form.laboratorio_id
      });
      setForm({ nome: '', descricao: '', laboratorio_id: '' });
      setErro('');
      carregarDados();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar equipamento.');
    }
  };

  const alternarStatus = async (id) => {
    try {
      await api.patch(`/api/equipamentos/${id}/status`);
      carregarDados();
    } catch (err) {
      setErro('Erro ao alterar status do equipamento.');
    }
  };

  // Função auxiliar para encontrar o nome do laboratório pelo ID
  const getNomeLaboratorio = (id) => {
    const lab = laboratorios.find(l => l.id === id);
    return lab ? lab.nome : 'Desconhecido';
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <button onClick={voltar} style={{ marginBottom: '20px' }}>⬅ Voltar ao Menu</button>
      
      <h2>Gestão de Equipamentos</h2>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {/* FORMULÁRIO DE CADASTRO */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h3>Cadastrar Novo Equipamento</h3>
        <form onSubmit={criarEquipamento} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            placeholder="Nome (ex: Projetor Epson)" 
            value={form.nome} 
            onChange={e => setForm({...form, nome: e.target.value})} 
            required 
            style={{ padding: '8px', flex: 1, minWidth: '200px' }}
          />
          <input 
            placeholder="Descrição (opcional)" 
            value={form.descricao} 
            onChange={e => setForm({...form, descricao: e.target.value})} 
            style={{ padding: '8px', flex: 1, minWidth: '200px' }}
          />
          <select 
            value={form.laboratorio_id} 
            onChange={e => setForm({...form, laboratorio_id: e.target.value})} 
            required
            style={{ padding: '8px', flex: 1, minWidth: '200px' }}
          >
            <option value="">Selecione um Laboratório</option>
            {laboratorios.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.nome}</option>
            ))}
          </select>
          <button type="submit" style={{ padding: '8px 15px' }}>Salvar</button>
        </form>
      </div>

      {/* LISTA DE EQUIPAMENTOS */}
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th style={{ padding: '8px' }}>Nome</th>
            <th>Descrição</th>
            <th>Laboratório</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {equipamentos.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: '8px', textAlign: 'center' }}>Nenhum equipamento cadastrado.</td></tr>
          ) : (
            equipamentos.map(equip => (
              <tr key={equip.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{equip.nome}</td>
                <td>{equip.descricao || '-'}</td>
                <td>{getNomeLaboratorio(equip.laboratorio_id)}</td>
                <td style={{ color: equip.status === 'ATIVO' ? 'green' : 'red', fontWeight: 'bold' }}>
                  {equip.status}
                </td>
                <td>
                  <button 
                    onClick={() => alternarStatus(equip.id)} 
                    style={{ 
                      padding: '5px 10px', 
                      cursor: 'pointer',
                      backgroundColor: equip.status === 'ATIVO' ? '#ffcccc' : '#ccffcc',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    {equip.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
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