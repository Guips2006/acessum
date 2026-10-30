import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { dataHoraParaIsoLocal, formatarDataHora } from './utils/formatosCadastro';

function paraUtcIso(valorLocal) {
  return new Date(valorLocal).toISOString();
}

function dataHoraLocal(valor) {
  const doisDigitos = numero => String(numero).padStart(2, '0');
  return `${valor.getFullYear()}-${doisDigitos(valor.getMonth() + 1)}-${doisDigitos(valor.getDate())}T${doisDigitos(valor.getHours())}:${doisDigitos(valor.getMinutes())}`;
}

export default function SolicitarReserva({ laboratorio, fechar, solicitada }) {
  const { api, user } = useContext(AuthContext);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const suspenso = user.status === 'SUSPENSO';
  const agoraLocalIso = dataHoraLocal(new Date());
  const fimSuspensao = user.suspensao_ate
    ? new Date(user.suspensao_ate).toLocaleString('pt-BR')
    : '';

  const enviarSolicitacao = async (evento) => {
    evento.preventDefault();
    setErro('');

    const inicioLocal = dataHoraParaIsoLocal(dataInicio);
    const fimLocal = dataHoraParaIsoLocal(dataFim);
    if (!inicioLocal || !fimLocal) {
      setErro('Informe datas e horários válidos no formato DD/MM/AAAA HH:mm.');
      return;
    }
    const inicio = new Date(inicioLocal);
    const fim = new Date(fimLocal);
    if (inicio < new Date(agoraLocalIso)) {
      setErro('A data de início da reserva deve estar no futuro.');
      return;
    }
    if (fim <= inicio) {
      setErro('Informe um período válido; o fim deve ser posterior ao início.');
      return;
    }

    setEnviando(true);
    try {
      const response = await api.post('/api/reservas/', {
        recurso_id: laboratorio.id,
        data_inicio: paraUtcIso(inicioLocal),
        data_fim: paraUtcIso(fimLocal),
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
      className="page-form-panel"
      aria-label={`Solicitar reserva de ${laboratorio.nome}`}
    >
      <h4 style={{ marginTop: 0 }}>Solicitar reserva: {laboratorio.nome}</h4>
      {suspenso && (
        <p className="feedback feedback-error" role="alert">
          Sua conta está suspensa{fimSuspensao ? ` até ${fimSuspensao}` : ''}. Novas reservas estão bloqueadas.
        </p>
      )}
      {erro && <p role="alert">{erro}</p>}
      <form onSubmit={enviarSolicitacao} style={{ display: 'grid', gap: '12px' }}>
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
        <label>
          Finalidade
          <textarea
            value={finalidade}
            onChange={evento => setFinalidade(evento.target.value)}
            maxLength={500}
            rows={3}
            required
          />
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={enviando || suspenso} aria-busy={enviando} style={estiloBotaoPrimario}>
            {enviando ? <LoadingSpinner label="A enviar..." inline /> : 'Enviar solicitação'}
          </button>
          <button type="button" onClick={fechar} className="button-secondary">
            Fechar
          </button>
        </div>
      </form>
    </section>
  );
}

const estiloBotaoPrimario = {
  padding: '10px 14px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
