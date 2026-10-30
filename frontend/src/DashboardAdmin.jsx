import React, { useContext, useEffect, useState } from 'react';
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { baixarRelatorio } from './utils/baixarRelatorio';
import { dataNascimentoParaIso, formatarDataNascimento, isoParaData } from './utils/formatosCadastro';

const CORES_STATUS = {
  PENDENTE: '#c27b12',
  APROVADA: '#13835b',
  RECUSADA: '#c23e49',
  EM_USO: '#1769aa',
  CONCLUIDA: '#526171',
  CANCELADA: '#7c6751',
  NO_SHOW: '#a43f24',
};

const ROTULOS_STATUS = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  EM_USO: 'Em uso',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  NO_SHOW: 'Não compareceu',
};

function dataLocal(valor) {
  const data = new Date(valor);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function periodoPadrao() {
  const fim = new Date();
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - 29);
  return { inicio: dataLocal(inicio), fim: dataLocal(fim) };
}

function parametrosPeriodo(inicio, fim) {
  const inicioIso = dataNascimentoParaIso(inicio);
  const fimIso = dataNascimentoParaIso(fim);
  if (!inicioIso || !fimIso) return {};
  const dataFimExclusiva = new Date(`${fimIso}T00:00:00`);
  dataFimExclusiva.setDate(dataFimExclusiva.getDate() + 1);
  return {
    data_inicio: new Date(`${inicioIso}T00:00:00`).toISOString(),
    data_fim: dataFimExclusiva.toISOString(),
  };
}

function formatarDataCurta(valor) {
  return new Date(`${valor}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function DashboardAdmin({ voltar }) {
  const { api } = useContext(AuthContext);
  const periodoInicial = periodoPadrao();
  const [dataInicio, setDataInicio] = useState(isoParaData(periodoInicial.inicio));
  const [dataFim, setDataFim] = useState(isoParaData(periodoInicial.fim));
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [formatoRelatorio, setFormatoRelatorio] = useState('csv');
  const [exportando, setExportando] = useState(false);

  const carregarDados = async (inicio, fim) => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/api/dashboard/reservas', {
        params: parametrosPeriodo(inicio, fim),
      });
      setDados(resposta.data);
    } catch (falha) {
      setErro(falha.response?.data?.detail || 'Não foi possível carregar o dashboard.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados(isoParaData(periodoInicial.inicio), isoParaData(periodoInicial.fim));
  }, [api]);

  const aplicarPeriodo = (evento) => {
    evento.preventDefault();
    const inicioIso = dataNascimentoParaIso(dataInicio);
    const fimIso = dataNascimentoParaIso(dataFim);
    if (!inicioIso || !fimIso || fimIso < inicioIso) {
      setErro('Informe um período válido, com a data final igual ou posterior à inicial.');
      return;
    }
    carregarDados(dataInicio, dataFim);
  };

  const exportarReservas = async () => {
    setErro('');
    setExportando(true);
    try {
      await baixarRelatorio(
        api,
        '/api/relatorios/reservas',
        formatoRelatorio,
        parametrosPeriodo(dataInicio, dataFim),
      );
    } catch {
      setErro('Não foi possível exportar o relatório. Ajuste o período e tente novamente.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <section className="admin-dashboard" aria-labelledby="admin-dashboard-title">
      <button type="button" className="dashboard-back-button" onClick={voltar}>
        Voltar ao menu
      </button>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">INDICADORES OPERACIONAIS</span>
          <h2 id="admin-dashboard-title">Dashboard de reservas</h2>
        </div>
        <form className="dashboard-filters" onSubmit={aplicarPeriodo}>
          <label>
            De
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dataInicio}
              onChange={evento => setDataInicio(formatarDataNascimento(evento.target.value))}
              required
            />
          </label>
          <label>
            Até
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dataFim}
              onChange={evento => setDataFim(formatarDataNascimento(evento.target.value))}
              required
            />
          </label>
          <button type="submit" disabled={carregando} aria-busy={carregando}>
            {carregando ? <LoadingSpinner label="Atualizando..." inline /> : 'Aplicar período'}
          </button>
          <label className="dashboard-export-format">
            Formato
            <select value={formatoRelatorio} onChange={evento => setFormatoRelatorio(evento.target.value)}>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <button type="button" onClick={exportarReservas} disabled={exportando || carregando} aria-busy={exportando}>
            {exportando ? <LoadingSpinner label="Exportando..." inline /> : 'Exportar relatório'}
          </button>
        </form>
      </div>

      {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
      {carregando && !dados ? (
        <LoadingSpinner label="Carregando indicadores..." />
      ) : dados ? (
        <>
          <div className="dashboard-kpi-row">
            <article className="dashboard-kpi">
              <span>Taxa de ocupação</span>
              <strong>{dados.taxa_ocupacao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</strong>
              <small>Laboratórios ativos no período selecionado</small>
            </article>
            <article className="dashboard-kpi">
              <span>Total de reservas</span>
              <strong>{dados.reservas_por_status.reduce((total, item) => total + item.quantidade, 0)}</strong>
              <small>Solicitações com início no período</small>
            </article>
            <article className="dashboard-kpi">
              <span>Não comparecimentos</span>
              <strong>{dados.reservas_por_status.find(item => item.status === 'NO_SHOW')?.quantidade || 0}</strong>
              <small>Ocorrências registradas no período</small>
            </article>
          </div>

          <div className="dashboard-chart-grid">
            <article className="dashboard-chart-panel">
              <h3>Reservas por status</h3>
              {dados.reservas_por_status.every(item => item.quantidade === 0) ? (
                <p className="dashboard-empty">Nenhuma reserva no período.</p>
              ) : (
                <div className="dashboard-pie-layout">
                  <div className="dashboard-chart" role="img" aria-label="Gráfico de pizza com reservas por status">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart accessibilityLayer>
                        <Pie
                          data={dados.reservas_por_status.filter(item => item.quantidade > 0)}
                          dataKey="quantidade"
                          nameKey="status"
                          innerRadius="54%"
                          outerRadius="82%"
                          paddingAngle={2}
                        >
                          {dados.reservas_por_status.filter(item => item.quantidade > 0).map(item => (
                            <Cell key={item.status} fill={CORES_STATUS[item.status]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(valor, nome) => [valor, ROTULOS_STATUS[nome] || nome]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="dashboard-legend">
                    {dados.reservas_por_status.filter(item => item.quantidade > 0).map(item => (
                      <li key={item.status}>
                        <span style={{ backgroundColor: CORES_STATUS[item.status] }} aria-hidden="true" />
                        <span>{ROTULOS_STATUS[item.status]}</span>
                        <strong>{item.quantidade}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className="dashboard-chart-panel">
              <h3>Evolução de não comparecimentos</h3>
              {dados.evolucao_no_shows.every(item => item.quantidade === 0) ? (
                <p className="dashboard-empty">Nenhum não comparecimento no período.</p>
              ) : (
                <div className="dashboard-chart dashboard-line-chart" role="img" aria-label="Gráfico diário de não comparecimentos">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados.evolucao_no_shows} margin={{ top: 12, right: 12, bottom: 4, left: -18 }} accessibilityLayer>
                      <XAxis dataKey="data" tickFormatter={formatarDataCurta} minTickGap={24} />
                      <YAxis allowDecimals={false} width={36} />
                      <Tooltip labelFormatter={valor => new Date(`${valor}T12:00:00`).toLocaleDateString('pt-BR')} />
                      <Line type="monotone" dataKey="quantidade" name="Não comparecimentos" stroke="#b34b36" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </div>
          {carregando && <LoadingSpinner label="Atualizando indicadores..." />}
        </>
      ) : !erro ? (
        <p className="dashboard-empty">Nenhum indicador disponível.</p>
      ) : null}
    </section>
  );
}