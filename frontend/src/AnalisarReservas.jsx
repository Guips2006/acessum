import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import { formatarStatus } from './utils/formatarStatus';

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR');
}

export default function AnalisarReservas({ voltar, onPendentesChange }) {
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
      onPendentesChange(response.data.length);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar solicitações pendentes.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, [api, onPendentesChange]);

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
    <section className="content-page" aria-labelledby="reservation-review-title">
      <button
        type="button"
        className="content-back-button"
        onClick={voltar}
      >
        ← Voltar ao Menu
      </button>
      <h2 id="reservation-review-title">Analisar solicitações de reserva</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      {carregando ? (
        <LoadingSpinner label="Carregando solicitações..." />
      ) : reservas.length === 0 ? (
        <p>Não há solicitações aguardando análise.</p>
      ) : (
        <div className="content-card-list">
          {reservas.map(reserva => (
            <article
              key={reserva.id}
            >
              <h3 style={{ margin: '0 0 8px' }}>{reserva.laboratorio_nome}</h3>
              <div className="reservation-person">
                <Avatar
                  className="reservation-avatar"
                  nome={reserva.usuario_nome}
                  src={reserva.usuario_avatar_url}
                  baseUrl={api.defaults.baseURL}
                />
                <span>Solicitante: <strong>{reserva.usuario_nome}</strong></span>
              </div>
              {reserva.co_reservantes?.length > 0 && (
                <div className="reservation-people">
                  <span>Co-reservantes</span>
                  {reserva.co_reservantes.map(coReservante => (
                    <div className="reservation-person" key={coReservante.id}>
                      <Avatar
                        className="reservation-avatar"
                        nome={coReservante.nome}
                        src={coReservante.avatar_url}
                        baseUrl={api.defaults.baseURL}
                      />
                      <strong>{coReservante.nome}</strong>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ margin: '4px 0' }}>Início: {formatarData(reserva.data_inicio)}</p>
              <p style={{ margin: '4px 0' }}>Fim: {formatarData(reserva.data_fim)}</p>
              <p style={{ margin: '4px 0' }}>Finalidade: {reserva.finalidade}</p>
              <p style={{ margin: '4px 0 12px', color: '#9a5700', fontWeight: 'bold' }}>
                Status: {formatarStatus(reserva.status)}
              </p>
              <label>
                Motivo da recusa (opcional)
                <textarea
                  value={motivos[reserva.id] || ''}
                  onChange={evento => setMotivos({ ...motivos, [reserva.id]: evento.target.value })}
                  maxLength={500}
                  rows={2}
                  style={estiloCampo}
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
                  {reservaEmAnalise === reserva.id ? <LoadingSpinner label="Processando..." inline /> : 'Aprovar'}
                </button>
                <button
                  type="button"
                  onClick={() => decidirReserva(reserva, 'RECUSADA')}
                  disabled={reservaEmAnalise === reserva.id}
                  aria-busy={reservaEmAnalise === reserva.id}
                  style={{ ...estiloBotao, backgroundColor: '#dc3545' }}
                >
                  {reservaEmAnalise === reserva.id ? <LoadingSpinner label="Processando..." inline /> : 'Recusar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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

const estiloBotao = {
  padding: '10px 14px',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
