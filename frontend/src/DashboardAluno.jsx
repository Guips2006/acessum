import React, { useCallback, useContext, useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPinned, ShieldCheck, Star, TriangleAlert } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import SolicitarReserva from './SolicitarReserva';

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function minutosAte(inicio) {
  return Math.ceil((new Date(inicio).getTime() - Date.now()) / 60_000);
}

export default function DashboardAluno({ explorarRecursos, verReservas }) {
  const { api, user } = useContext(AuthContext);
  const [resumo, setResumo] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [carregandoFavoritos, setCarregandoFavoritos] = useState(true);
  const [erroResumo, setErroResumo] = useState('');
  const [erroFavoritos, setErroFavoritos] = useState('');
  const [reservaEmCheckin, setReservaEmCheckin] = useState(null);
  const [erroCheckin, setErroCheckin] = useState('');
  const [reservaSelecionada, setReservaSelecionada] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const carregarResumo = useCallback(async (mostrarCarregamento = false) => {
    if (mostrarCarregamento) setCarregandoResumo(true);
    setErroResumo('');
    try {
      const resposta = await api.get('/api/dashboard/aluno/resumo');
      setResumo(resposta.data);
    } catch (erro) {
      setErroResumo(erro.response?.data?.detail || 'Não foi possível carregar o resumo da conta.');
    } finally {
      setCarregandoResumo(false);
    }
  }, [api]);

  const carregarFavoritos = useCallback(async () => {
    setErroFavoritos('');
    try {
      const resposta = await api.get('/api/favoritos');
      setFavoritos(resposta.data);
    } catch (erro) {
      setErroFavoritos(erro.response?.data?.detail || 'Não foi possível carregar seus laboratórios favoritos.');
    } finally {
      setCarregandoFavoritos(false);
    }
  }, [api]);

  useEffect(() => {
    carregarResumo(true);
    carregarFavoritos();
  }, [carregarFavoritos, carregarResumo]);

  useEffect(() => {
    const intervalo = window.setInterval(() => carregarResumo(), 30_000);
    return () => window.clearInterval(intervalo);
  }, [carregarResumo]);

  const fazerCheckin = async (reserva) => {
    setErroCheckin('');
    setReservaEmCheckin(reserva.id);
    try {
      await api.patch(`/api/reservas/${reserva.id}/checkin`);
      setMensagemSucesso(`Presença confirmada para a reserva no ${reserva.laboratorio_nome}.`);
      await carregarResumo();
    } catch (erro) {
      setErroCheckin(erro.response?.data?.detail || 'Não foi possível confirmar a presença.');
      await carregarResumo();
    } finally {
      setReservaEmCheckin(null);
    }
  };

  const statusRegular = resumo?.status_conta === 'ATIVO' && resumo.faltas_no_periodo === 0;
  const statusSuspenso = resumo?.status_conta === 'SUSPENSO';
  const statusInativo = resumo?.status_conta === 'INATIVO';
  const statusAviso = resumo?.faltas_no_periodo > 0 && !statusSuspenso;

  return (
    <section className="dashboard-view">
      <div className="welcome-panel">
        <div className="welcome-copy">
          <span className="eyebrow">PAINEL DO ALUNO</span>
          <h2>Olá, {user.nome?.split(' ')[0] || 'estudante'}.</h2>
          <p>Consulte seus horários, acompanhe suas reservas e encontre o espaço ideal para estudar.</p>
        </div>
        <div className="welcome-graphic" aria-hidden="true">
          <span className="graphic-orbit orbit-one" />
          <span className="graphic-orbit orbit-two" />
          <span className="graphic-core">A</span>
        </div>
      </div>

      {erroResumo && <p className="feedback feedback-error" role="alert">{erroResumo}</p>}
      {mensagemSucesso && <p className="feedback feedback-success" role="status">{mensagemSucesso}</p>}
      {erroCheckin && <p className="feedback feedback-error" role="alert">{erroCheckin}</p>}

      {resumo?.reservas_checkin?.map(reserva => {
        const faltam = minutosAte(reserva.data_inicio);
        const comecou = faltam <= 0;
        return (
          <article className="aluno-checkin-card" key={reserva.id} aria-live="polite">
            <div className="aluno-checkin-icon"><Clock3 size={22} aria-hidden="true" /></div>
            <div className="aluno-checkin-copy">
              <span className="eyebrow">AÇÃO PRIORITÁRIA</span>
              <h3>Sua reserva no {reserva.laboratorio_nome} começa {comecou ? 'agora' : `em ${faltam} min`}</h3>
              <p>Início previsto para {formatarData(reserva.data_inicio)}. Confirme sua presença dentro da janela de check-in.</p>
            </div>
            <button
              type="button"
              className="button-primary"
              onClick={() => fazerCheckin(reserva)}
              disabled={reservaEmCheckin === reserva.id}
              aria-busy={reservaEmCheckin === reserva.id}
            >
              {reservaEmCheckin === reserva.id
                ? <LoadingSpinner label="Confirmando..." inline />
                : 'Confirmar presença'}
            </button>
          </article>
        );
      })}

      <div className="aluno-dashboard-grid">
        <article className={`aluno-status-card${statusSuspenso || statusInativo ? ' is-critical' : statusAviso ? ' is-warning' : ''}`}>
          <div className="aluno-status-heading">
            {statusAviso || statusSuspenso
              ? <TriangleAlert size={22} aria-hidden="true" />
              : <ShieldCheck size={22} aria-hidden="true" />}
            <h3>Status da conta</h3>
          </div>
          {carregandoResumo ? (
            <LoadingSpinner label="Carregando status da conta..." />
          ) : resumo ? (
            <>
              <p className="aluno-status-count">
                {resumo.faltas_no_periodo}/{resumo.limite_no_show} faltas registradas nos últimos 30 dias
              </p>
              <strong>
                {statusSuspenso
                  ? 'Conta suspensa'
                  : statusInativo
                    ? 'Conta inativa'
                  : statusRegular
                    ? 'Conta regular'
                    : `Atenção: ${resumo.faltas_restantes} ${resumo.faltas_restantes === 1 ? 'falta restante' : 'faltas restantes'} até o limite`}
              </strong>
              {statusSuspenso && resumo.suspensao_ate && (
                <p>A suspensão termina em {formatarData(resumo.suspensao_ate)}.</p>
              )}
            </>
          ) : (
            <p>O status da conta está indisponível no momento.</p>
          )}
        </article>

        <button type="button" className="aluno-action-card" onClick={explorarRecursos}>
          <MapPinned size={22} aria-hidden="true" />
          <span><strong>Explorar recursos</strong><small>Encontre laboratórios e consulte horários livres.</small></span>
        </button>
        <button type="button" className="aluno-action-card" onClick={verReservas}>
          <CalendarDays size={22} aria-hidden="true" />
          <span><strong>Minhas reservas</strong><small>Acompanhe solicitações, reservas e check-ins.</small></span>
        </button>
      </div>

      <section className="aluno-favoritos">
        <div className="aluno-favoritos-heading">
          <div>
            <span className="eyebrow">ACESSO RÁPIDO</span>
            <h2>Seus favoritos</h2>
          </div>
          <button type="button" className="button-secondary" onClick={explorarRecursos}>
            Explorar laboratórios
          </button>
        </div>
        {erroFavoritos && <p className="feedback feedback-error" role="alert">{erroFavoritos}</p>}
        {carregandoFavoritos ? (
          <LoadingSpinner label="Carregando favoritos..." />
        ) : favoritos.length === 0 ? (
          <p className="aluno-favoritos-empty">Você ainda não favoritou nenhum laboratório. Explore os recursos para adicionar seus espaços preferidos.</p>
        ) : (
          <div className="aluno-favoritos-grid">
            {favoritos.map(laboratorio => (
              <article className="aluno-favorito-card" key={laboratorio.id}>
                <div className="aluno-favorito-title">
                  <Star size={18} fill="currentColor" aria-hidden="true" />
                  <h3>{laboratorio.nome}</h3>
                </div>
                <p>Capacidade: {laboratorio.capacidade} lugares</p>
                {laboratorio.status === 'ATIVO' ? (
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => {
                      setMensagemSucesso('');
                      setReservaSelecionada(laboratorio);
                    }}
                  >
                    Solicitar reserva
                  </button>
                ) : (
                  <p className="aluno-favorito-inativo">Este laboratório está indisponível para novas reservas.</p>
                )}
              </article>
            ))}
          </div>
        )}
        {reservaSelecionada && (
          <SolicitarReserva
            laboratorio={reservaSelecionada}
            fechar={() => setReservaSelecionada(null)}
            solicitada={reserva => {
              setReservaSelecionada(null);
              setMensagemSucesso(`Solicitação enviada para ${reserva.laboratorio_nome}.`);
            }}
          />
        )}
      </section>
    </section>
  );
}
