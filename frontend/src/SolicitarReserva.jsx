import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';

function paraUtcIso(valorLocal) {
  return new Date(valorLocal).toISOString();
}

export default function SolicitarReserva({ laboratorio, fechar, solicitada }) {
  const { api } = useContext(AuthContext);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarSolicitacao = async (evento) => {
    evento.preventDefault();
    setErro('');

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
      setErro('Informe um período válido; o fim deve ser posterior ao início.');
      return;
    }

    setEnviando(true);
    try {
      const response = await api.post('/api/reservas/', {
        recurso_id: laboratorio.id,
        data_inicio: paraUtcIso(dataInicio),
        data_fim: paraUtcIso(dataFim),
        finalidade: finalidade.trim(),
      });
      solicitada(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível solicitar a reserva.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      aria-label={`Solicitar reserva de ${laboratorio.nome}`}
      style={{ marginTop: '14px', padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px' }}
    >
      <h4 style={{ marginTop: 0 }}>Solicitar reserva: {laboratorio.nome}</h4>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      <form onSubmit={enviarSolicitacao} style={{ display: 'grid', gap: '12px' }}>
        <label>
          Início
          <input
            type="datetime-local"
            value={dataInicio}
            onChange={evento => setDataInicio(evento.target.value)}
            required
            style={estiloInput}
          />
        </label>
        <label>
          Fim
          <input
            type="datetime-local"
            value={dataFim}
            onChange={evento => setDataFim(evento.target.value)}
            required
            style={estiloInput}
          />
        </label>
        <label>
          Finalidade
          <textarea
            value={finalidade}
            onChange={evento => setFinalidade(evento.target.value)}
            maxLength={500}
            rows={3}
            required
            style={estiloInput}
          />
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={enviando} style={estiloBotaoPrimario}>
            {enviando ? 'A enviar...' : 'Enviar solicitação'}
          </button>
          <button type="button" onClick={fechar} style={estiloBotaoSecundario}>
            Fechar
          </button>
        </div>
      </form>
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

const estiloBotaoSecundario = {
  padding: '10px 14px',
  color: '#333333',
  backgroundColor: '#ffffff',
  border: '1px solid #cccccc',
  borderRadius: '8px',
  cursor: 'pointer',
};
