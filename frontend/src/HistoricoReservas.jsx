import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';

function formatarData(valor) {
  return new Date(valor).toLocaleString();
}

function permiteCancelar(reserva) {
  const estadosCancelaveis = ['PENDENTE', 'APROVADA'];
  const horasAteInicio = new Date(reserva.data_inicio).getTime() - Date.now();
  return estadosCancelaveis.includes(reserva.status) && horasAteInicio >= 60 * 60 * 1000;
}

function permiteCheckin(reserva) {
  const inicio = new Date(reserva.data_inicio).getTime();
  const agora = Date.now();
  return reserva.status === 'APROVADA'
    && agora >= inicio - 15 * 60 * 1000
    && agora <= inicio + 15 * 60 * 1000;
}

export default function HistoricoReservas({ voltar }) {
  const { api } = useContext(AuthContext);
  const [reservas, setReservas] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [reservaEmCancelamento, setReservaEmCancelamento] = useState(null);
  const [reservaEmCheckin, setReservaEmCheckin] = useState(null);
  const [reservaEmEncerramento, setReservaEmEncerramento] = useState(null);

  const carregarReservas = useCallback(async (limparErro = true, mostrarCarregamento = true) => {
    if (mostrarCarregamento) setCarregando(true);
    if (limparErro) setErro('');
    try {
      const response = await api.get('/api/reservas/minhas-reservas');
      setReservas(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar o histórico de reservas.');
    } finally {
      if (mostrarCarregamento) setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    carregarReservas();
  }, [carregarReservas]);

  useEffect(() => {
    const intervalo = window.setInterval(() => carregarReservas(false, false), 60_000);
    return () => window.clearInterval(intervalo);
  }, [carregarReservas]);

  const cancelarReserva = async (reserva) => {
    if (!window.confirm(`Confirma o cancelamento da reserva de ${reserva.laboratorio_nome}?`)) {
      return;
    }

    setErro('');
    setSucesso('');
    setReservaEmCancelamento(reserva.id);
    try {
      await api.patch(`/api/reservas/${reserva.id}/cancelar`);
      setSucesso(`Reserva de ${reserva.laboratorio_nome} cancelada.`);
      await carregarReservas();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível cancelar a reserva.');
    } finally {
      setReservaEmCancelamento(null);
    }
  };

  const fazerCheckin = async (reserva) => {
    setErro('');
    setSucesso('');
    setReservaEmCheckin(reserva.id);
    try {
      await api.patch(`/api/reservas/${reserva.id}/checkin`);
      setSucesso(`Check-in registado para ${reserva.laboratorio_nome}.`);
      await carregarReservas();
    } catch (err) {
      const mensagem = err.response?.data?.detail || 'Não foi possível fazer o check-in.';
      await carregarReservas(false);
      setErro(mensagem);
    } finally {
      setReservaEmCheckin(null);
    }
  };

  const encerrarReserva = async (reserva) => {
    if (!window.confirm(`Confirma o encerramento da utilização de ${reserva.laboratorio_nome}?`)) {
      return;
    }

    setErro('');
    setSucesso('');
    setReservaEmEncerramento(reserva.id);
    try {
      await api.patch(`/api/reservas/${reserva.id}/encerrar`);
      setSucesso(`Utilização de ${reserva.laboratorio_nome} encerrada.`);
      await carregarReservas();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível encerrar a utilização.');
    } finally {
      setReservaEmEncerramento(null);
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
      <h2>Minhas reservas</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      {carregando ? (
        <p role="status">A carregar histórico...</p>
      ) : reservas.length === 0 ? (
        <p>Ainda não existem reservas no seu histórico.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {reservas.map(reserva => (
            <article
              key={reserva.id}
              style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              <h3 style={{ margin: '0 0 8px' }}>{reserva.laboratorio_nome}</h3>
              <p style={{ margin: '4px 0' }}>Início: {formatarData(reserva.data_inicio)}</p>
              <p style={{ margin: '4px 0' }}>Fim: {formatarData(reserva.data_fim)}</p>
              <p style={{ margin: '4px 0' }}>Finalidade: {reserva.finalidade}</p>
              <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Status: {reserva.status}</p>
              {reserva.data_fim_real && (
                <p style={{ margin: '4px 0' }}>Utilização encerrada em: {formatarData(reserva.data_fim_real)}</p>
              )}
              {reserva.motivo_recusa && (
                <p style={{ margin: '4px 0' }}>Motivo da recusa: {reserva.motivo_recusa}</p>
              )}
              {permiteCheckin(reserva) && (
                <button
                  type="button"
                  onClick={() => fazerCheckin(reserva)}
                  disabled={reservaEmCheckin === reserva.id}
                  style={{ marginTop: '8px', marginRight: '8px', padding: '10px 14px', color: '#ffffff', backgroundColor: '#28a745', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {reservaEmCheckin === reserva.id ? 'A registar...' : 'Fazer check-in'}
                </button>
              )}
              {reserva.status === 'EM_USO' && (
                <button
                  type="button"
                  onClick={() => encerrarReserva(reserva)}
                  disabled={reservaEmEncerramento === reserva.id}
                  style={{ marginTop: '8px', marginRight: '8px', padding: '10px 14px', color: '#ffffff', backgroundColor: '#0056b3', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {reservaEmEncerramento === reserva.id ? 'A encerrar...' : 'Encerrar utilização'}
                </button>
              )}
              {permiteCancelar(reserva) && (
                <button
                  type="button"
                  onClick={() => cancelarReserva(reserva)}
                  disabled={reservaEmCancelamento === reserva.id}
                  style={{ marginTop: '8px', padding: '10px 14px', color: '#ffffff', backgroundColor: '#dc3545', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {reservaEmCancelamento === reserva.id ? 'A cancelar...' : 'Cancelar reserva'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
