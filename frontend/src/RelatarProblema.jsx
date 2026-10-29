import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function RelatarProblema({ tipoRecurso, recursoId, recursoNome, fechar }) {
  const { api } = useContext(AuthContext);
  const [descricao, setDescricao] = useState('');
  const [nivelSeveridade, setNivelSeveridade] = useState('MEDIA');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarRelato = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    setEnviando(true);
    try {
      await api.post('/api/problemas/', {
        tipo_recurso: tipoRecurso,
        recurso_id: recursoId,
        descricao: descricao.trim(),
        nivel_severidade: nivelSeveridade,
      });
      setSucesso('Problema reportado com sucesso.');
      setDescricao('');
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível enviar o relato.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      aria-label={`Relatar problema em ${recursoNome}`}
      style={{ marginTop: '12px', padding: '16px', backgroundColor: '#fff4d6', border: '1px solid #d39b27', borderRadius: '8px' }}
    >
      <h4 style={{ marginTop: 0 }}>Relatar problema: {recursoNome}</h4>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}
      <form onSubmit={enviarRelato} style={{ display: 'grid', gap: '12px' }}>
        <label>
          Descrição do problema
          <textarea
            value={descricao}
            onChange={evento => setDescricao(evento.target.value)}
            minLength={1}
            maxLength={2000}
            rows={4}
            required
            style={estiloCampo}
          />
        </label>
        <label>
          Severidade
          <select
            value={nivelSeveridade}
            onChange={evento => setNivelSeveridade(evento.target.value)}
            style={estiloCampo}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={enviando} aria-busy={enviando} style={estiloBotaoEnviar}>
            {enviando ? <LoadingSpinner label="A enviar..." inline /> : 'Enviar relato'}
          </button>
          <button type="button" onClick={fechar} style={estiloBotaoCancelar}>
            Fechar
          </button>
        </div>
      </form>
    </section>
  );
}

const estiloCampo = {
  display: 'block',
  boxSizing: 'border-box',
  width: '100%',
  marginTop: '6px',
  padding: '10px',
  border: '1px solid #cccccc',
  borderRadius: '8px',
};

const estiloBotaoEnviar = {
  padding: '10px 14px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const estiloBotaoCancelar = {
  padding: '10px 14px',
  color: '#333333',
  backgroundColor: '#ffffff',
  border: '1px solid #cccccc',
  borderRadius: '8px',
  cursor: 'pointer',
};
