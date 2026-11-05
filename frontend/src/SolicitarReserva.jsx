import React, { useContext, useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

function paraUtcIso(valorLocal) {
  return new Date(valorLocal).toISOString();
}

function dataHoraLocal(valor) {
  const doisDigitos = numero => String(numero).padStart(2, '0');
  return `${valor.getFullYear()}-${doisDigitos(valor.getMonth() + 1)}-${doisDigitos(valor.getDate())}T${doisDigitos(valor.getHours())}:${doisDigitos(valor.getMinutes())}`;
}

function formatarDataHoraBrasileira(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor);
  if (!partes) return '';
  const [, ano, mes, dia, hora, minuto] = partes;
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

function interpretarDataHoraBrasileira(valor) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(valor);
  if (!partes) return '';

  const [, diaTexto, mesTexto, anoTexto, horaTexto, minutoTexto] = partes;
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);
  const hora = Number(horaTexto);
  const minuto = Number(minutoTexto);
  if (ano < 1 || hora > 23 || minuto > 59) return '';

  const data = new Date(0);
  data.setHours(hora, minuto, 0, 0);
  data.setFullYear(ano, mes - 1, dia);
  if (
    data.getFullYear() !== ano
    || data.getMonth() !== mes - 1
    || data.getDate() !== dia
    || data.getHours() !== hora
    || data.getMinutes() !== minuto
  ) return '';

  return `${anoTexto}-${mesTexto}-${diaTexto}T${horaTexto}:${minutoTexto}`;
}

export default function SolicitarReserva({ laboratorio, fechar, solicitada }) {
  const { api, user } = useContext(AuthContext);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataInicioTexto, setDataInicioTexto] = useState('');
  const [dataFimTexto, setDataFimTexto] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [termoCoReservante, setTermoCoReservante] = useState('');
  const [resultadosCoReservantes, setResultadosCoReservantes] = useState([]);
  const [coReservantes, setCoReservantes] = useState([]);
  const [buscandoCoReservantes, setBuscandoCoReservantes] = useState(false);
  const [erroBuscaCoReservantes, setErroBuscaCoReservantes] = useState('');
  const calendarioInicioRef = useRef(null);
  const calendarioFimRef = useRef(null);
  const suspenso = user.status === 'SUSPENSO';
  const agoraLocal = dataHoraLocal(new Date());
  const minimoFim = dataInicio || agoraLocal;
  const fimSuspensao = user.suspensao_ate
    ? new Date(user.suspensao_ate).toLocaleString('pt-BR')
    : '';

  useEffect(() => {
    const termo = termoCoReservante.trim();
    if (user.perfil !== 'ALUNO' || termo.length < 2) {
      setResultadosCoReservantes([]);
      setErroBuscaCoReservantes('');
      setBuscandoCoReservantes(false);
      return undefined;
    }

    let ativa = true;
    const temporizador = window.setTimeout(async () => {
      setBuscandoCoReservantes(true);
      setErroBuscaCoReservantes('');
      try {
        const resposta = await api.get('/api/alunos/busca', { params: { termo } });
        if (ativa) setResultadosCoReservantes(resposta.data);
      } catch (falha) {
        if (ativa) {
          setErroBuscaCoReservantes(
            falha.response?.data?.detail || 'Não foi possível buscar alunos.',
          );
        }
      } finally {
        if (ativa) setBuscandoCoReservantes(false);
      }
    }, 300);
    return () => {
      ativa = false;
      window.clearTimeout(temporizador);
    };
  }, [api, termoCoReservante, user.perfil]);

  const enviarSolicitacao = async (evento) => {
    evento.preventDefault();
    setErro('');

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio < new Date(agoraLocal)) {
      setErro('Informe uma data de início válida e futura.');
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
        data_inicio: paraUtcIso(dataInicio),
        data_fim: paraUtcIso(dataFim),
        finalidade: finalidade.trim(),
        co_reservante_ids: coReservantes.map(coReservante => coReservante.id),
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
      className="content-card content-card-muted reservation-request-card"
      aria-label={`Solicitar reserva de ${laboratorio.nome}`}
    >
      <h4 className="content-card-title">Solicitar reserva: {laboratorio.nome}</h4>
      {suspenso && (
        <p className="feedback feedback-error" role="alert">
          Sua conta está suspensa{fimSuspensao ? ` até ${fimSuspensao}` : ''}. Novas reservas estão bloqueadas.
        </p>
      )}
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      <form onSubmit={enviarSolicitacao} style={{ display: 'grid', gap: '12px' }}>
        <label>
          Início
          <span className="date-time-control">
            <input
              type="text"
              inputMode="text"
              lang="pt-BR"
              placeholder="DD/MM/AAAA HH:mm"
              value={dataInicioTexto}
              aria-invalid={Boolean(dataInicioTexto && !dataInicio)}
              aria-describedby={dataInicioTexto && !dataInicio ? 'reserva-data-inicio-erro' : undefined}
              onChange={evento => {
                const texto = evento.target.value;
                setDataInicioTexto(texto);
                setDataInicio(interpretarDataHoraBrasileira(texto));
              }}
              required
              style={estiloInput}
            />
            <button
              type="button"
              className="date-time-picker-button"
              aria-label="Escolher data e hora de início pelo calendário"
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
              className="date-time-calendar-input"
              type="datetime-local"
              lang="pt-BR"
              min={agoraLocal}
              value={dataInicio}
              tabIndex={-1}
              aria-hidden="true"
              onChange={evento => {
                setDataInicio(evento.target.value);
                setDataInicioTexto(formatarDataHoraBrasileira(evento.target.value));
              }}
            />
          </span>
          {dataInicioTexto && !dataInicio && (
            <small id="reserva-data-inicio-erro" className="date-time-error">
              Informe uma data e hora válida no formato DD/MM/AAAA HH:mm.
            </small>
          )}
        </label>
        <label>
          Fim
          <span className="date-time-control">
            <input
              type="text"
              inputMode="text"
              lang="pt-BR"
              placeholder="DD/MM/AAAA HH:mm"
              value={dataFimTexto}
              aria-invalid={Boolean(dataFimTexto && !dataFim)}
              aria-describedby={dataFimTexto && !dataFim ? 'reserva-data-fim-erro' : undefined}
              onChange={evento => {
                const texto = evento.target.value;
                setDataFimTexto(texto);
                setDataFim(interpretarDataHoraBrasileira(texto));
              }}
              required
              style={estiloInput}
            />
            <button
              type="button"
              className="date-time-picker-button"
              aria-label="Escolher data e hora de fim pelo calendário"
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
              className="date-time-calendar-input"
              type="datetime-local"
              lang="pt-BR"
              min={minimoFim}
              value={dataFim}
              tabIndex={-1}
              aria-hidden="true"
              onChange={evento => {
                setDataFim(evento.target.value);
                setDataFimTexto(formatarDataHoraBrasileira(evento.target.value));
              }}
            />
          </span>
          {dataFimTexto && !dataFim && (
            <small id="reserva-data-fim-erro" className="date-time-error">
              Informe uma data e hora válida no formato DD/MM/AAAA HH:mm.
            </small>
          )}
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
        {user.perfil === 'ALUNO' && (
          <fieldset className="co-reservantes-fieldset">
            <legend>Co-reservantes (opcional)</legend>
            <label htmlFor="buscar-co-reservantes">Buscar por nome ou e-mail</label>
            <input
              id="buscar-co-reservantes"
              type="search"
              value={termoCoReservante}
              onChange={evento => setTermoCoReservante(evento.target.value)}
              placeholder="Digite pelo menos 2 caracteres"
              autoComplete="off"
              style={estiloInput}
            />
            {buscandoCoReservantes && <LoadingSpinner label="Buscando alunos..." />}
            {erroBuscaCoReservantes && <p className="feedback feedback-error" role="alert">{erroBuscaCoReservantes}</p>}
            {resultadosCoReservantes.length > 0 && (
              <ul className="co-reservantes-resultados" aria-label="Resultados da busca">
                {resultadosCoReservantes.map(aluno => {
                  const selecionado = coReservantes.some(coReservante => coReservante.id === aluno.id);
                  return (
                    <li key={aluno.id}>
                      <span><strong>{aluno.nome}</strong><small>{aluno.email}</small></span>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => {
                          if (!selecionado) setCoReservantes(atual => [...atual, aluno]);
                        }}
                        disabled={selecionado}
                      >
                        {selecionado ? 'Adicionado' : 'Adicionar'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {termoCoReservante.trim().length > 0 && termoCoReservante.trim().length < 2 && (
              <p className="co-reservantes-ajuda">Digite pelo menos 2 caracteres para buscar.</p>
            )}
            {coReservantes.length > 0 && (
              <ul className="co-reservantes-selecionados" aria-label="Co-reservantes selecionados">
                {coReservantes.map(aluno => (
                  <li key={aluno.id}>
                    <span>{aluno.nome} <small>{aluno.email}</small></span>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setCoReservantes(atual => atual.filter(item => item.id !== aluno.id))}
                      aria-label={`Remover ${aluno.nome} da lista de co-reservantes`}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={enviando || suspenso} aria-busy={enviando} style={estiloBotaoPrimario}>
            {enviando ? <LoadingSpinner label="Enviando..." inline /> : 'Enviar solicitação'}
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
