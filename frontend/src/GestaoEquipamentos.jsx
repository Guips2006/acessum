import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function GestaoEquipamentos({ voltar }) {
  const { api } = useContext(AuthContext);
  const [equipamentos, setEquipamentos] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [form, setForm] = useState({ nome: '', descricao: '', laboratorio_id: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [equipamentoEmAtualizacao, setEquipamentoEmAtualizacao] = useState(null);

  const carregarDados = async () => {
    setCarregando(true);
    setErro('');
    try {
      const [resEquipamentos, resLaboratorios] = await Promise.all([
        api.get('/api/equipamentos/'),
        api.get('/api/laboratorios/'),
      ]);
      setEquipamentos(resEquipamentos.data);
      setLaboratorios(resLaboratorios.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar equipamentos e laboratórios.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [api]);

  const criarEquipamento = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await api.post('/api/equipamentos/', {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        laboratorio_id: form.laboratorio_id,
      });
      setForm({ nome: '', descricao: '', laboratorio_id: '' });
      setSucesso('Equipamento cadastrado com sucesso.');
      await carregarDados();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar equipamento.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (equipamento) => {
    const acao = equipamento.status === 'ATIVO' ? 'inativar' : 'ativar';
    if (!window.confirm(`Confirma ${acao} o equipamento "${equipamento.nome}"?`)) return;

    setErro('');
    setSucesso('');
    setEquipamentoEmAtualizacao(equipamento.id);
    try {
      const response = await api.patch(`/api/equipamentos/${equipamento.id}/status`);
      setSucesso(`Status do equipamento atualizado para ${response.data.novo_status}.`);
      await carregarDados();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao alterar status do equipamento.');
    } finally {
      setEquipamentoEmAtualizacao(null);
    }
  };

  const laboratoriosAtivos = laboratorios.filter(laboratorio => laboratorio.status === 'ATIVO');
  const nomeLaboratorio = (laboratorioId) => (
    laboratorios.find(laboratorio => laboratorio.id === laboratorioId)?.nome || 'Laboratório não encontrado'
  );

  return (
    <section style={{ marginTop: '20px', color: '#333333' }}>
      <button
        type="button"
        onClick={voltar}
        style={{ marginBottom: '20px', padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer' }}
      >
        ← Voltar ao Menu
      </button>

      <h2>Gestão de Equipamentos</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>Cadastrar novo equipamento</h3>
        <form onSubmit={criarEquipamento} style={{ display: 'grid', gap: '12px' }}>
          <label>
            Nome
            <input
              name="nome"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              maxLength={100}
              required
              style={estiloInput}
            />
          </label>
          <label>
            Descrição (opcional)
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              maxLength={500}
              rows={3}
              style={estiloInput}
            />
          </label>
          <label>
            Laboratório
            <select
              name="laboratorio_id"
              value={form.laboratorio_id}
              onChange={e => setForm({ ...form, laboratorio_id: e.target.value })}
              required
              style={estiloInput}
            >
              <option value="">Selecione um laboratório ativo</option>
              {laboratoriosAtivos.map(laboratorio => (
                <option key={laboratorio.id} value={laboratorio.id}>{laboratorio.nome}</option>
              ))}
            </select>
          </label>
          {laboratoriosAtivos.length === 0 && !carregando && (
            <p role="status" style={{ color: '#856404' }}>
              Não há laboratórios ativos. Ative ou cadastre um laboratório antes de continuar.
            </p>
          )}
          <button
            type="submit"
            disabled={salvando || carregando || laboratoriosAtivos.length === 0}
            aria-busy={salvando}
            style={estiloBotaoPrimario}
          >
            {salvando ? <LoadingSpinner label="A guardar..." inline /> : 'Salvar equipamento'}
          </button>
        </form>
      </div>

      <section aria-labelledby="lista-equipamentos-titulo">
        <h3 id="lista-equipamentos-titulo">Equipamentos cadastrados</h3>
        {carregando ? (
          <LoadingSpinner label="A carregar equipamentos..." />
        ) : equipamentos.length === 0 ? (
          <p>Nenhum equipamento cadastrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {equipamentos.map(equipamento => (
              <article
                key={equipamento.id}
                style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >
                <h4 style={{ margin: '0 0 8px' }}>{equipamento.nome}</h4>
                <p style={{ margin: '4px 0' }}>Descrição: {equipamento.descricao || '—'}</p>
                <p style={{ margin: '4px 0' }}>Laboratório: {nomeLaboratorio(equipamento.laboratorio_id)}</p>
                <p style={{ margin: '4px 0 12px', color: equipamento.status === 'ATIVO' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                  Status: {equipamento.status}
                </p>
                <button
                  type="button"
                  onClick={() => alternarStatus(equipamento)}
                  disabled={equipamentoEmAtualizacao === equipamento.id}
                  aria-busy={equipamentoEmAtualizacao === equipamento.id}
                  style={{
                    ...estiloBotaoStatus,
                    backgroundColor: equipamento.status === 'ATIVO' ? '#dc3545' : '#28a745',
                  }}
                >
                  {equipamentoEmAtualizacao === equipamento.id
                    ? <LoadingSpinner label="A atualizar..." inline />
                    : equipamento.status === 'ATIVO' ? 'Inativar equipamento' : 'Ativar equipamento'}
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
