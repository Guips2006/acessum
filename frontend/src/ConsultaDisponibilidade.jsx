import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { dataHoraParaIsoLocal, formatarDataHora } from './utils/formatosCadastro';

function paraUtcIso(valorLocal) {
  return new Date(valorLocal).toISOString();
}

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR');
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

    const inicioLocal = dataHoraParaIsoLocal(dataInicio);
    const fimLocal = dataHoraParaIsoLocal(dataFim);
    if (!inicioLocal || !fimLocal) {
      setErro('Informe datas e horários válidos no formato DD/MM/AAAA HH:mm.');
      return;
    }
    const inicio = new Date(inicioLocal);
    const fim = new Date(fimLocal);
    if (fim <= inicio) {
      setErro('Informe um período válido; o fim deve ser posterior ao início.');
      return;
    }

    setConsultando(true);
    try {
      const response = await api.get('/api/reservas/disponibilidade', {
        params: {
          recurso_id: laboratorio.id,
          data_inicio: paraUtcIso(inicioLocal),
          data_fim: paraUtcIso(fimLocal),
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
      className="page-form-panel"
      aria-label={`Disponibilidade de ${laboratorio.nome}`}
    >
      <h4 style={{ marginTop: 0 }}>Consultar disponibilidade</h4>
      {erro && <p role="alert">{erro}</p>}
      <form onSubmit={consultar} style={{ display: 'grid', gap: '12px' }}>
        <label>
          Início
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA HH:mm"
            maxLength={16}
            value={dataInicio}
            onChange={evento => setDataInicio(formatarDataHora(evento.target.value))}
            required
          />
        </label>
        <label>
          Fim
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA HH:mm"
            maxLength={16}
            value={dataFim}
            onChange={evento => setDataFim(formatarDataHora(evento.target.value))}
            required
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
            <h5 className="text-status-positive">Horários livres</h5>
            {disponibilidade.blocos_livres.length === 0 ? (
              <p>Nenhum horário livre neste período.</p>
            ) : disponibilidade.blocos_livres.map((bloco, index) => (
              <p
                key={`livre-${index}`}
                className="availability-slot is-available"
              >
                {formatarData(bloco.inicio)} — {formatarData(bloco.fim)}
              </p>
            ))}
          </div>
          <div>
            <h5 className="text-status-negative">Horários ocupados</h5>
            {disponibilidade.blocos_ocupados.length === 0 ? (
              <p>Nenhum horário ocupado neste período.</p>
            ) : disponibilidade.blocos_ocupados.map((bloco, index) => (
              <p
                key={`ocupado-${index}`}
                className="availability-slot is-occupied"
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

const estiloBotao = {
  padding: '10px 14px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
