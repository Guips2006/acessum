import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import { baixarRelatorio } from './utils/baixarRelatorio';
import { formatarStatus } from './utils/formatarStatus';

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function interpretarDataBrasileira(valor) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return '';

  const [, diaTexto, mesTexto, anoTexto] = partes;
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);
  if (ano < 1) return '';

  const data = new Date(0);
  data.setHours(0, 0, 0, 0);
  data.setFullYear(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return '';
  }

  return `${anoTexto}-${mesTexto}-${diaTexto}`;
}

function formatarEntradaDataBrasileira(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function formatarDataBrasileira(valor) {
  if (!valor) return '';
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

function permiteCancelar(reserva, usuarioId) {
  const estadosCancelaveis = ['PENDENTE', 'APROVADA'];
  const horasAteInicio = new Date(reserva.data_inicio).getTime() - Date.now();
  return reserva.usuario_id === usuarioId
    && estadosCancelaveis.includes(reserva.status)
    && horasAteInicio >= 60 * 60 * 1000;
}

function permiteCheckin(reserva, usuarioId) {
  const inicio = new Date(reserva.data_inicio).getTime();
  const agora = Date.now();
  return reserva.usuario_id === usuarioId
    && reserva.status === 'APROVADA'
    && agora >= inicio - 15 * 60 * 1000
    && agora <= inicio + 15 * 60 * 1000;
}

export default function HistoricoReservas({ voltar }) {
  const { api, user } = useContext(AuthContext);
  const [reservas, setReservas] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [reservaEmCancelamento, setReservaEmCancelamento] = useState(null);
  const [reservaEmCheckin, setReservaEmCheckin] = useState(null);
  const [reservaEmEncerramento, setReservaEmEncerramento] = useState(null);
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');
  const [filtroInicioTexto, setFiltroInicioTexto] = useState('');
  const [filtroFimTexto, setFiltroFimTexto] = useState('');
  const [erroDataInicio, setErroDataInicio] = useState('');
  const [erroDataFim, setErroDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [formatoRelatorio, setFormatoRelatorio] = useState('csv');
  const [exportando, setExportando] = useState(false);
  const calendarioInicioRef = useRef(null);
  const calendarioFimRef = useRef(null);

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
      setSucesso(`Check-in registrado para ${reserva.laboratorio_nome}.`);
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
    if (!window.confirm(`Confirma o encerramento do uso de ${reserva.laboratorio_nome}?`)) {
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
      setErro(err.response?.data?.detail || 'Não foi possível encerrar o uso.');
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
      const inicio = new Date(`${filtroInicio}T00:00:00`);
      const fim = new Date(`${filtroFim}T00:00:00`);
      if (fim < inicio || fim - inicio > 366 * 24 * 60 * 60 * 1000) {
        setErro('Informe um período válido de até 366 dias.');
        return;
      }
    }
    setExportando(true);
    const filtros = {};
    if (filtroInicio) {
      filtros.data_inicio = new Date(`${filtroInicio}T00:00:00`).toISOString();
    }
    if (filtroFim) {
      const fimExclusivo = new Date(`${filtroFim}T00:00:00`);
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

  const reservasFiltradas = erroDataInicio || erroDataFim
    ? []
    : reservas.filter(reserva => {
      const inicio = new Date(reserva.data_inicio).getTime();
      const inicioFiltro = filtroInicio ? new Date(`${filtroInicio}T00:00:00`).getTime() : null;
      const fimFiltro = filtroFim ? new Date(`${filtroFim}T00:00:00`).getTime() + 24 * 60 * 60 * 1000 : null;
      return (!inicioFiltro || inicio >= inicioFiltro)
        && (!fimFiltro || inicio < fimFiltro)
        && (!filtroStatus || reserva.status === filtroStatus);
    });

  return (
    <section className="history-view content-page">
      <header className="history-header">
        <button type="button" className="button-secondary history-back-button" onClick={voltar}>
          ← Voltar ao Menu
        </button>
        <h2>Minhas reservas</h2>
      </header>
      <section className="history-report-controls" aria-label="Filtros e exportação do histórico">
        <div className="history-report-field">
          <label htmlFor="history-start-date">De</label>
          <span className="history-date-control">
            <input
              id="history-start-date"
              type="text"
              inputMode="numeric"
              lang="pt-BR"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={filtroInicioTexto}
              aria-invalid={Boolean(erroDataInicio)}
              aria-describedby={erroDataInicio ? 'history-start-date-error' : undefined}
              onChange={evento => {
                const texto = formatarEntradaDataBrasileira(evento.target.value);
                const data = interpretarDataBrasileira(texto);
                setFiltroInicioTexto(texto);
                setFiltroInicio(data);
                setErroDataInicio(texto && !data ? 'Informe uma data válida no formato DD/MM/AAAA.' : '');
              }}
            />
            <button
              type="button"
              className="history-date-picker-button"
              aria-label="Escolher data inicial pelo calendário"
              onClick={() => {
                const calendario = calendarioInicioRef.current;
                if (typeof calendario?.showPicker === 'function') calendario.showPicker();
                else calendario?.click();
              }}
            >
              <CalendarDays size={18} aria-hidden="true" />
            </button>
            <input
              ref={calendarioInicioRef}
              className="history-calendar-input"
              type="date"
              lang="pt-BR"
              max={filtroFim || undefined}
              value={filtroInicio}
              tabIndex={-1}
              aria-hidden="true"
              onChange={evento => {
                setFiltroInicio(evento.target.value);
                setFiltroInicioTexto(formatarDataBrasileira(evento.target.value));
                setErroDataInicio('');
              }}
            />
          </span>
          {erroDataInicio && <small id="history-start-date-error" className="history-date-error">{erroDataInicio}</small>}
        </div>
        <div className="history-report-field">
          <label htmlFor="history-end-date">Até</label>
          <span className="history-date-control">
            <input
              id="history-end-date"
              type="text"
              inputMode="numeric"
              lang="pt-BR"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={filtroFimTexto}
              aria-invalid={Boolean(erroDataFim)}
              aria-describedby={erroDataFim ? 'history-end-date-error' : undefined}
              onChange={evento => {
                const texto = formatarEntradaDataBrasileira(evento.target.value);
                const data = interpretarDataBrasileira(texto);
                setFiltroFimTexto(texto);
                setFiltroFim(data);
                setErroDataFim(texto && !data ? 'Informe uma data válida no formato DD/MM/AAAA.' : '');
              }}
            />
            <button
              type="button"
              className="history-date-picker-button"
              aria-label="Escolher data final pelo calendário"
              onClick={() => {
                const calendario = calendarioFimRef.current;
                if (typeof calendario?.showPicker === 'function') calendario.showPicker();
                else calendario?.click();
              }}
            >
              <CalendarDays size={18} aria-hidden="true" />
            </button>
            <input
              ref={calendarioFimRef}
              className="history-calendar-input"
              type="date"
              lang="pt-BR"
              min={filtroInicio || undefined}
              value={filtroFim}
              tabIndex={-1}
              aria-hidden="true"
              onChange={evento => {
                setFiltroFim(evento.target.value);
                setFiltroFimTexto(formatarDataBrasileira(evento.target.value));
                setErroDataFim('');
              }}
            />
          </span>
          {erroDataFim && <small id="history-end-date-error" className="history-date-error">{erroDataFim}</small>}
        </div>
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
        <button
          type="button"
          onClick={exportarHistorico}
          disabled={exportando || carregando || Boolean(erroDataInicio || erroDataFim)}
          aria-busy={exportando}
        >
          {exportando ? <LoadingSpinner label="Exportando..." inline /> : 'Exportar relatório'}
        </button>
      </section>

      {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
      {sucesso && <p className="feedback feedback-success" role="status">{sucesso}</p>}

      <section className="history-results" aria-label="Reservas do histórico">
        {carregando ? (
          <LoadingSpinner label="Carregando histórico..." />
        ) : reservasFiltradas.length === 0 ? (
          reservas.length === 0 ? (
            <p className="history-empty">Ainda não existem reservas no seu histórico.</p>
          ) : erroDataInicio || erroDataFim ? (
            <p className="history-empty">Corrija as datas para exibir as reservas.</p>
          ) : (
            <p className="history-empty">Nenhuma reserva corresponde aos filtros selecionados.</p>
          )
        ) : (
          <div className="history-reservation-list">
            {reservasFiltradas.map(reserva => (
              <article key={reserva.id} className="history-reservation-card">
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
              {reserva.usuario_id !== user.id && (
                <p className="shared-reservation-note">
                  Você participa desta reserva como co-reservante.
                </p>
              )}
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
              <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Status: {formatarStatus(reserva.status)}</p>
              {reserva.data_fim_real && (
                <p style={{ margin: '4px 0' }}>Utilização encerrada em: {formatarData(reserva.data_fim_real)}</p>
              )}
              {reserva.motivo_recusa && (
                <p style={{ margin: '4px 0' }}>Motivo da recusa: {reserva.motivo_recusa}</p>
              )}
              {permiteCheckin(reserva, user.id) && (
                <button
                  type="button"
                  onClick={() => fazerCheckin(reserva)}
                  disabled={reservaEmCheckin === reserva.id}
                  aria-busy={reservaEmCheckin === reserva.id}
                  className="button-primary history-action-button"
                >
                  {reservaEmCheckin === reserva.id ? <LoadingSpinner label="Confirmando..." inline /> : 'Fazer check-in'}
                </button>
              )}
              {reserva.status === 'EM_USO' && (
                <button
                  type="button"
                  onClick={() => encerrarReserva(reserva)}
                  disabled={reservaEmEncerramento === reserva.id}
                  aria-busy={reservaEmEncerramento === reserva.id}
                  className="button-primary history-action-button"
                >
                  {reservaEmEncerramento === reserva.id ? <LoadingSpinner label="Encerrando..." inline /> : 'Encerrar uso'}
                </button>
              )}
              {permiteCancelar(reserva, user.id) && (
                <button
                  type="button"
                  onClick={() => cancelarReserva(reserva)}
                  disabled={reservaEmCancelamento === reserva.id}
                  aria-busy={reservaEmCancelamento === reserva.id}
                  className="history-cancel-button"
                >
                  {reservaEmCancelamento === reserva.id ? <LoadingSpinner label="Cancelando..." inline /> : 'Cancelar reserva'}
                </button>
              )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
