import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR');
}

export default function AnalisarReservas({ voltar }) {
  const { api } = useContext(AuthContext);
  const [reservas, setReservas] = useState([]);
  const [motivos, setMotivos] = useState({});
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [reservaEmAnalise, setReservaEmAnalise] = useState(null);

  const carregarReservas = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/api/reservas/pendentes');
      setReservas(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar solicitações pendentes.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, [api]);

  const decidirReserva = async (reserva, novoStatus) => {
    setErro('');
    setSucesso('');
    setReservaEmAnalise(reserva.id);
    try {
      await api.patch(`/api/reservas/${reserva.id}/analise`, {
        status: novoStatus,
        motivo_recusa: novoStatus === 'RECUSADA' ? motivos[reserva.id]?.trim() || null : null,
      });
      setSucesso(
        novoStatus === 'APROVADA'
          ? `Reserva de ${reserva.laboratorio_nome} aprovada.`
          : `Solicitação de ${reserva.laboratorio_nome} recusada.`,
      );
      await carregarReservas();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível analisar a solicitação.');
    } finally {
      setReservaEmAnalise(null);
    }
  };

  return (
    <section className="page-container">
      <button
        type="button"
        className="page-back-button"
        onClick={voltar}
      >
        ← Voltar ao Menu
      </button>
      <h2>Analisar solicitações de reserva</h2>
      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">{sucesso}</p>}

      {carregando ? (
        <LoadingSpinner label="A carregar solicitações..." />
      ) : reservas.length === 0 ? (
        <p>Não há solicitações aguardando análise.</p>
      ) : (
        <div className="page-list">
          {reservas.map(reserva => (
            <article
              key={reserva.id}
              className="page-card"
            >
              <h3 style={{ margin: '0 0 8px' }}>{reserva.laboratorio_nome}</h3>
              <p style={{ margin: '4px 0' }}>Solicitante: {reserva.usuario_nome}</p>
              <p style={{ margin: '4px 0' }}>Início: {formatarData(reserva.data_inicio)}</p>
              <p style={{ margin: '4px 0' }}>Fim: {formatarData(reserva.data_fim)}</p>
              <p style={{ margin: '4px 0' }}>Finalidade: {reserva.finalidade}</p>
              <p className="text-status-warning" style={{ margin: '4px 0 12px', fontWeight: 'bold' }}>
                Status: {reserva.status}
              </p>
              <label>
                Motivo da recusa (opcional)
                <textarea
                  value={motivos[reserva.id] || ''}
                  onChange={evento => setMotivos({ ...motivos, [reserva.id]: evento.target.value })}
                  maxLength={500}
                  rows={2}
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => decidirReserva(reserva, 'APROVADA')}
                  disabled={reservaEmAnalise === reserva.id}
                  aria-busy={reservaEmAnalise === reserva.id}
                  style={{ ...estiloBotao, backgroundColor: '#28a745' }}
                >
                  {reservaEmAnalise === reserva.id ? <LoadingSpinner label="A processar..." inline /> : 'Aprovar'}
                </button>
                <button
                  type="button"
                  onClick={() => decidirReserva(reserva, 'RECUSADA')}
                  disabled={reservaEmAnalise === reserva.id}
                  aria-busy={reservaEmAnalise === reserva.id}
                  style={{ ...estiloBotao, backgroundColor: '#dc3545' }}
                >
                  {reservaEmAnalise === reserva.id ? <LoadingSpinner label="A processar..." inline /> : 'Recusar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const estiloBotao = {
  padding: '10px 14px',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
