import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { baixarRelatorio } from './utils/baixarRelatorio';
import { dataNascimentoParaIso, formatarDataNascimento } from './utils/formatosCadastro';

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR');
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
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [formatoRelatorio, setFormatoRelatorio] = useState('csv');
  const [exportando, setExportando] = useState(false);

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

  const exportarHistorico = async () => {
    setErro('');
    setSucesso('');
    if (Boolean(filtroInicio) !== Boolean(filtroFim)) {
      setErro('Informe as datas inicial e final juntas para exportar por período.');
      return;
    }
    if (filtroInicio && filtroFim) {
      const inicioIso = dataNascimentoParaIso(filtroInicio);
      const fimIso = dataNascimentoParaIso(filtroFim);
      if (!inicioIso || !fimIso) {
        setErro('Informe datas válidas no formato DD/MM/AAAA.');
        return;
      }
      const inicio = new Date(`${inicioIso}T00:00:00`);
      const fim = new Date(`${fimIso}T00:00:00`);
      if (fim < inicio || fim - inicio > 366 * 24 * 60 * 60 * 1000) {
        setErro('Informe um período válido de até 366 dias.');
        return;
      }
    }
    setExportando(true);
    const filtros = {};
    if (filtroInicio) {
      const inicioIso = dataNascimentoParaIso(filtroInicio);
      if (!inicioIso) {
        setErro('Informe uma data inicial válida no formato DD/MM/AAAA.');
        setExportando(false);
        return;
      }
      filtros.data_inicio = new Date(`${inicioIso}T00:00:00`).toISOString();
    }
    if (filtroFim) {
      const fimIso = dataNascimentoParaIso(filtroFim);
      if (!fimIso) {
        setErro('Informe uma data final válida no formato DD/MM/AAAA.');
        setExportando(false);
        return;
      }
      const fimExclusivo = new Date(`${fimIso}T00:00:00`);
      fimExclusivo.setDate(fimExclusivo.getDate() + 1);
      filtros.data_fim = fimExclusivo.toISOString();
    }
    if (filtroStatus) filtros.status = filtroStatus;

    try {
      await baixarRelatorio(api, '/api/relatorios/minhas-reservas', formatoRelatorio, filtros);
      setSucesso(`Relatório ${formatoRelatorio.toUpperCase()} exportado.`);
    } catch {
      setErro('Não foi possível exportar o relatório. Ajuste os filtros e tente novamente.');
    } finally {
      setExportando(false);
    }
  };

  const reservasFiltradas = reservas.filter(reserva => {
    const inicio = new Date(reserva.data_inicio).getTime();
    const inicioIso = dataNascimentoParaIso(filtroInicio);
    const fimIso = dataNascimentoParaIso(filtroFim);
    const inicioFiltro = inicioIso ? new Date(`${inicioIso}T00:00:00`).getTime() : null;
    const fimFiltro = fimIso ? new Date(`${fimIso}T00:00:00`).getTime() + 24 * 60 * 60 * 1000 : null;
    return (!inicioFiltro || inicio >= inicioFiltro)
      && (!fimFiltro || inicio < fimFiltro)
      && (!filtroStatus || reserva.status === filtroStatus);
  });

  return (
    <section className="page-container">
      <button
        type="button"
        className="page-back-button"
        onClick={voltar}
      >
        ← Voltar ao Menu
      </button>
      <h2>Minhas reservas</h2>
      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">{sucesso}</p>}

      <div className="history-report-controls">
        <label>
          De
          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={filtroInicio} onChange={evento => setFiltroInicio(formatarDataNascimento(evento.target.value))} />
        </label>
        <label>
          Até
          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={filtroFim} onChange={evento => setFiltroFim(formatarDataNascimento(evento.target.value))} />
        </label>
        <label>
          Status
          <select value={filtroStatus} onChange={evento => setFiltroStatus(evento.target.value)}>
            <option value="">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="APROVADA">Aprovada</option>
            <option value="RECUSADA">Recusada</option>
            <option value="EM_USO">Em uso</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="NO_SHOW">Não compareceu</option>
          </select>
        </label>
        <label>
          Formato
          <select value={formatoRelatorio} onChange={evento => setFormatoRelatorio(evento.target.value)}>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
        <button type="button" onClick={exportarHistorico} disabled={exportando || carregando} aria-busy={exportando}>
          {exportando ? <LoadingSpinner label="Exportando..." inline /> : 'Exportar relatório'}
        </button>
      </div>

      {carregando ? (
        <LoadingSpinner label="A carregar histórico..." />
      ) : reservasFiltradas.length === 0 ? (
        reservas.length === 0 ? (
        <p>Ainda não existem reservas no seu histórico.</p>
        ) : (
          <p>Nenhuma reserva corresponde aos filtros selecionados.</p>
        )
      ) : (
        <div className="page-list">
          {reservasFiltradas.map(reserva => (
            <article
              key={reserva.id}
              className="page-card"
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
                  aria-busy={reservaEmCheckin === reserva.id}
                  style={{ marginTop: '8px', marginRight: '8px', padding: '10px 14px', color: '#ffffff', backgroundColor: '#28a745', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {reservaEmCheckin === reserva.id ? <LoadingSpinner label="A registar..." inline /> : 'Fazer check-in'}
                </button>
              )}
              {reserva.status === 'EM_USO' && (
                <button
                  type="button"
                  onClick={() => encerrarReserva(reserva)}
                  disabled={reservaEmEncerramento === reserva.id}
                  aria-busy={reservaEmEncerramento === reserva.id}
                  style={{ marginTop: '8px', marginRight: '8px', padding: '10px 14px', color: '#ffffff', backgroundColor: '#0056b3', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {reservaEmEncerramento === reserva.id ? <LoadingSpinner label="A encerrar..." inline /> : 'Encerrar utilização'}
                </button>
              )}
              {permiteCancelar(reserva) && (
                <button
                  type="button"
                  onClick={() => cancelarReserva(reserva)}
                  disabled={reservaEmCancelamento === reserva.id}
                  aria-busy={reservaEmCancelamento === reserva.id}
                  style={{ marginTop: '8px', padding: '10px 14px', color: '#ffffff', backgroundColor: '#dc3545', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {reservaEmCancelamento === reserva.id ? <LoadingSpinner label="A cancelar..." inline /> : 'Cancelar reserva'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
