import React, { useContext, useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

function inicioDaSemana(valor) {
  const data = valor ? new Date(`${valor}T12:00:00`) : new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() - ((data.getDay() + 6) % 7));
  return data;
}

function formatoDataInput(data) {
  const ano = String(data.getFullYear()).padStart(4, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = String(data.getFullYear()).padStart(4, '0');
  return `${dia}/${mes}/${ano}`;
}

function interpretarData(valor) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return null;

  const [, diaTexto, mesTexto, anoTexto] = partes;
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);
  if (ano < 1) return null;
  const data = new Date(0);
  data.setHours(0, 0, 0, 0);
  data.setFullYear(ano, mes - 1, dia);

  if (
    data.getFullYear() !== ano
    || data.getMonth() !== mes - 1
    || data.getDate() !== dia
  ) return null;

  return data;
}

function formatarHora(valor) {
  return new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function blocosDoDia(blocos, dia) {
  const inicioDia = new Date(dia);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(inicioDia);
  fimDia.setDate(fimDia.getDate() + 1);
  return blocos.flatMap((bloco, indice) => {
    const inicio = Math.max(new Date(bloco.inicio).getTime(), inicioDia.getTime());
    const fim = Math.min(new Date(bloco.fim).getTime(), fimDia.getTime());
    if (fim <= inicio) return [];
    return [{ indice, inicio: new Date(inicio), fim: new Date(fim) }];
  });
}

export default function GradeSemanal({ laboratorio, fechar }) {
  const { api } = useContext(AuthContext);
  const [semana, setSemana] = useState(() => inicioDaSemana());
  const [dataSemana, setDataSemana] = useState(() => formatarData(inicioDaSemana()));
  const [erroData, setErroData] = useState('');
  const [grade, setGrade] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const calendarioRef = useRef(null);

  useEffect(() => {
    let ativa = true;
    const carregarGrade = async () => {
      setCarregando(true);
      setErro('');
      setGrade(null);
      const inicioIso = new Date(semana).toISOString();
      try {
        const resposta = await api.get('/api/reservas/grade-semanal', {
          params: { recurso_id: laboratorio.id, semana_inicio: inicioIso },
        });
        if (ativa) setGrade(resposta.data);
      } catch (falha) {
        if (ativa) {
          setErro(falha.response?.data?.detail || 'Não foi possível carregar a grade semanal.');
        }
      } finally {
        if (ativa) setCarregando(false);
      }
    };
    carregarGrade();
    return () => { ativa = false; };
  }, [api, laboratorio.id, semana]);

  const selecionarSemana = (data) => {
    const inicio = inicioDaSemana(formatoDataInput(data));
    if (formatoDataInput(inicio) !== formatoDataInput(semana)) setSemana(inicio);
    setDataSemana(formatarData(inicio));
    setErroData('');
  };

  const confirmarDataSemana = () => {
    const data = interpretarData(dataSemana);
    if (!data) {
      setErroData('Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }
    selecionarSemana(data);
  };

  const alterarSemana = (dias) => {
    const proximaSemana = (atual) => {
      const proxima = new Date(atual);
      proxima.setDate(proxima.getDate() + dias);
      return proxima;
    };
    const proxima = proximaSemana(semana);
    selecionarSemana(proxima);
  };

  const abrirCalendario = () => {
    const calendario = calendarioRef.current;
    if (typeof calendario?.showPicker === 'function') {
      calendario.showPicker();
    } else {
      calendario?.click();
    }
  };

  const dias = Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(semana);
    dia.setDate(dia.getDate() + indice);
    return dia;
  });
  const semanaFim = new Date(semana);
  semanaFim.setDate(semanaFim.getDate() + 6);
  const periodoSemana = `${formatarData(semana)} a ${formatarData(semanaFim)}`;

  return (
    <div className="grade-modal-backdrop" onMouseDown={evento => {
      if (evento.target === evento.currentTarget) fechar();
    }}>
      <section
        className="grade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-semanal-titulo"
      >
        <header className="grade-modal-header">
          <div>
            <span className="eyebrow">DISPONIBILIDADE</span>
            <h2 id="grade-semanal-titulo">Grade semanal — {laboratorio.nome}</h2>
          </div>
          <button type="button" className="grade-fechar" onClick={fechar} aria-label="Fechar grade semanal">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="grade-controles">
          <button type="button" className="grade-navegar" onClick={() => alterarSemana(-7)} aria-label="Ver semana anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <label htmlFor="grade-data-semana">
            Semana iniciada em
          </label>
          <div className="grade-data-controle">
            <input
              id="grade-data-semana"
              className="grade-semana-input"
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dataSemana}
              aria-invalid={Boolean(erroData)}
              aria-describedby={erroData ? 'grade-data-erro' : undefined}
              onChange={evento => {
                setDataSemana(evento.target.value);
                if (erroData) setErroData('');
              }}
              onBlur={confirmarDataSemana}
              onKeyDown={evento => {
                if (evento.key === 'Enter') evento.currentTarget.blur();
              }}
            />
            <button
              type="button"
              className="grade-navegar"
              onClick={abrirCalendario}
              aria-label="Escolher semana pelo calendário"
            >
              <CalendarDays size={18} aria-hidden="true" />
            </button>
            <input
              ref={calendarioRef}
              className="grade-calendario-input"
              type="date"
              tabIndex={-1}
              aria-label="Escolher semana pelo calendário"
              value={formatoDataInput(semana)}
              onChange={evento => {
                if (evento.target.value) selecionarSemana(inicioDaSemana(evento.target.value));
              }}
            />
          </div>
          <button type="button" className="grade-navegar" onClick={() => alterarSemana(7)} aria-label="Ver próxima semana">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <span>{periodoSemana}</span>
        </div>
        {erroData && <p className="feedback feedback-error" id="grade-data-erro" role="alert">{erroData}</p>}

        <p className="grade-observacao">
          A grade considera reservas aprovadas e em uso registradas no sistema. Os períodos livres são estimativas e não substituem a confirmação do horário de funcionamento do laboratório.
        </p>
        {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
        {carregando ? (
          <LoadingSpinner label="Carregando grade semanal..." />
        ) : grade ? (
          <>
            <div className="grade-legenda" aria-label="Legenda da grade">
              <span><i className="grade-indicador is-livre" /> Período livre</span>
              <span><i className="grade-indicador is-ocupado" /> Período ocupado</span>
            </div>
            <div className="grade-dias">
              {dias.map((dia, indice) => {
                const livres = blocosDoDia(grade.blocos_livres, dia);
                const ocupados = blocosDoDia(grade.blocos_ocupados, dia);
                return (
                  <article className="grade-dia" key={formatoDataInput(dia)}>
                    <h3>{dia.toLocaleDateString('pt-BR', { weekday: 'long' })} — {formatarData(dia)}</h3>
                    <div className="grade-periodos">
                      {ocupados.map(bloco => (
                        <p className="grade-periodo is-ocupado" key={`ocupado-${indice}-${bloco.indice}`}>
                          Ocupado: {formatarHora(bloco.inicio)}–{formatarHora(bloco.fim)}
                        </p>
                      ))}
                      {livres.map(bloco => (
                        <p className="grade-periodo is-livre" key={`livre-${indice}-${bloco.indice}`}>
                          Livre: {formatarHora(bloco.inicio)}–{formatarHora(bloco.fim)}
                        </p>
                      ))}
                      {livres.length === 0 && ocupados.length === 0 && (
                        <p className="grade-sem-periodos">Sem reservas registradas.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
