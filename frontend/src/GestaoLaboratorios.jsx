import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function GestaoLaboratorios({ voltar }) {
  const { api } = useContext(AuthContext);
  const [laboratorios, setLaboratorios] = useState([]);
  const [form, setForm] = useState({ nome: '', capacidade: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [laboratorioEmAtualizacao, setLaboratorioEmAtualizacao] = useState(null);

  const carregarLaboratorios = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/api/laboratorios/');
      setLaboratorios(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar laboratórios.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLaboratorios();
  }, [api]);

  const criarLaboratorio = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await api.post('/api/laboratorios/', {
        nome: form.nome.trim(),
        capacidade: Number(form.capacidade),
      });
      setForm({ nome: '', capacidade: '' });
      setSucesso('Laboratório cadastrado com sucesso.');
      await carregarLaboratorios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar laboratório.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (laboratorio) => {
    const acao = laboratorio.status === 'ATIVO' ? 'inativar' : 'ativar';
    if (!window.confirm(`Confirma ${acao} o laboratório "${laboratorio.nome}"?`)) return;

    setErro('');
    setSucesso('');
    setLaboratorioEmAtualizacao(laboratorio.id);
    try {
      const response = await api.patch(`/api/laboratorios/${laboratorio.id}/status`);
      setSucesso(`Status do laboratório atualizado para ${response.data.novo_status}.`);
      await carregarLaboratorios();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao alterar status do laboratório.');
    } finally {
      setLaboratorioEmAtualizacao(null);
    }
  };

  return (
    <section style={{ marginTop: '20px', color: '#333333' }}>
      <button
        type="button"
        onClick={voltar}
        style={{ marginBottom: '20px', padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer' }}
      >
        ← Voltar ao Menu
      </button>

      <h2>Gestão de Laboratórios</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>Cadastrar Novo Laboratório</h3>
        <form onSubmit={criarLaboratorio} style={{ display: 'grid', gap: '12px' }}>
          <label>
            Nome do laboratório
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
            Capacidade (lugares)
            <input
              name="capacidade"
              type="number"
              min="1"
              step="1"
              value={form.capacidade}
              onChange={e => setForm({ ...form, capacidade: e.target.value })}
              required
              style={estiloInput}
            />
          </label>
          <button type="submit" disabled={salvando} aria-busy={salvando} style={estiloBotaoPrimario}>
            {salvando ? <LoadingSpinner label="A guardar..." inline /> : 'Salvar laboratório'}
          </button>
        </form>
      </div>

      <section aria-labelledby="lista-laboratorios-titulo">
        <h3 id="lista-laboratorios-titulo">Laboratórios cadastrados</h3>
        {carregando ? (
          <LoadingSpinner label="A carregar laboratórios..." />
        ) : laboratorios.length === 0 ? (
          <p>Nenhum laboratório cadastrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {laboratorios.map(laboratorio => (
              <article
                key={laboratorio.id}
                style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >
                <h4 style={{ margin: '0 0 8px' }}>{laboratorio.nome}</h4>
                <p style={{ margin: '4px 0' }}>Capacidade: {laboratorio.capacidade} lugares</p>
                <p style={{ margin: '4px 0 12px', color: laboratorio.status === 'ATIVO' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                  Status: {laboratorio.status}
                </p>
                <button
                  type="button"
                  onClick={() => alternarStatus(laboratorio)}
                  disabled={laboratorioEmAtualizacao === laboratorio.id}
                  aria-busy={laboratorioEmAtualizacao === laboratorio.id}
                  style={{
                    ...estiloBotaoStatus,
                    backgroundColor: laboratorio.status === 'ATIVO' ? '#dc3545' : '#28a745',
                  }}
                >
                  {laboratorioEmAtualizacao === laboratorio.id
                    ? <LoadingSpinner label="A atualizar..." inline />
                    : laboratorio.status === 'ATIVO' ? 'Inativar laboratório' : 'Ativar laboratório'}
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