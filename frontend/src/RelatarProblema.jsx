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
      className="page-form-panel problem-report-panel"
      aria-label={`Relatar problema em ${recursoNome}`}
    >
      <h4 style={{ marginTop: 0 }}>Relatar problema: {recursoNome}</h4>
      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">{sucesso}</p>}
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
          />
        </label>
        <label>
          Severidade
          <select
            value={nivelSeveridade}
            onChange={evento => setNivelSeveridade(evento.target.value)}
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
          <button type="button" onClick={fechar} className="button-secondary">
            Fechar
          </button>
        </div>
      </form>
    </section>
  );
}

const estiloBotaoEnviar = {
  padding: '10px 14px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
