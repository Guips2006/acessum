import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

function paraUtcIso(valorLocal) {
  return new Date(valorLocal).toISOString();
}

function formatarData(valor) {
  return new Date(valor).toLocaleString();
}

export default function ConsultaDisponibilidade({ laboratorio }) {
  const { api } = useContext(AuthContext);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [disponibilidade, setDisponibilidade] = useState(null);
  const [erro, setErro] = useState('');
  const [consultando, setConsultando] = useState(false);

  const consultar = async (evento) => {
    evento.preventDefault();
    setErro('');
    setDisponibilidade(null);

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
      setErro('Informe um período válido; o fim deve ser posterior ao início.');
      return;
    }

    setConsultando(true);
    try {
      const response = await api.get('/api/reservas/disponibilidade', {
        params: {
          recurso_id: laboratorio.id,
          data_inicio: paraUtcIso(dataInicio),
          data_fim: paraUtcIso(dataFim),
        },
      });
      setDisponibilidade(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao consultar a disponibilidade.');
    } finally {
      setConsultando(false);
    }
  };

  return (
    <section
      aria-label={`Disponibilidade de ${laboratorio.nome}`}
      style={{ marginTop: '14px', padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px' }}
    >
      <h4 style={{ marginTop: 0 }}>Consultar disponibilidade</h4>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      <form onSubmit={consultar} style={{ display: 'grid', gap: '12px' }}>
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
        <button type="submit" disabled={consultando} aria-busy={consultando} style={estiloBotao}>
          {consultando ? <LoadingSpinner label="A consultar..." inline /> : 'Ver horários'}
        </button>
      </form>

      {disponibilidade && (
        <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
          <h5 style={{ margin: 0 }}>
            {disponibilidade.recurso.nome}: {formatarData(disponibilidade.periodo.inicio)} — {formatarData(disponibilidade.periodo.fim)}
          </h5>
          <div>
            <h5 style={{ color: '#28a745' }}>Horários livres</h5>
            {disponibilidade.blocos_livres.length === 0 ? (
              <p>Nenhum horário livre neste período.</p>
            ) : disponibilidade.blocos_livres.map((bloco, index) => (
              <p
                key={`livre-${index}`}
                style={{ padding: '10px', backgroundColor: '#ccffcc', border: '1px solid #b7e4b7', borderRadius: '8px' }}
              >
                {formatarData(bloco.inicio)} — {formatarData(bloco.fim)}
              </p>
            ))}
          </div>
          <div>
            <h5 style={{ color: '#dc3545' }}>Horários ocupados</h5>
            {disponibilidade.blocos_ocupados.length === 0 ? (
              <p>Nenhum horário ocupado neste período.</p>
            ) : disponibilidade.blocos_ocupados.map((bloco, index) => (
              <p
                key={`ocupado-${index}`}
                style={{ padding: '10px', backgroundColor: '#eeeeee', border: '1px solid #dddddd', borderRadius: '8px' }}
              >
                {formatarData(bloco.inicio)} — {formatarData(bloco.fim)}
              </p>
            ))}
          </div>
        </div>
      )}
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

const estiloBotao = {
  padding: '10px 14px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
