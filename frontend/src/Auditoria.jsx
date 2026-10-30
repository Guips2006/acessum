import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { dataNascimentoParaIso, formatarDataNascimento } from './utils/formatosCadastro';

const LIMITE_PAGINA = 50;

function parametrosPeriodo(inicio, fim, deslocamento) {
  const parametros = { limite: LIMITE_PAGINA, deslocamento };
  if (inicio && fim) {
    const inicioIso = dataNascimentoParaIso(inicio);
    const fimIso = dataNascimentoParaIso(fim);
    if (!inicioIso || !fimIso) return parametros;
    const dataFimExclusiva = new Date(`${fimIso}T00:00:00`);
    dataFimExclusiva.setDate(dataFimExclusiva.getDate() + 1);
    parametros.data_inicio = new Date(`${inicioIso}T00:00:00`).toISOString();
    parametros.data_fim = dataFimExclusiva.toISOString();
  }
  return parametros;
}

function formatarData(valor) {
  return new Date(valor).toLocaleString('pt-BR');
}

export default function Auditoria({ voltar }) {
  const { api } = useContext(AuthContext);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [acao, setAcao] = useState('');
  const [entidade, setEntidade] = useState('');
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState({ logs: [], total: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarLogs = async (filtros = { dataInicio, dataFim, acao, entidade, pagina }) => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/api/auditoria', {
        params: {
          ...parametrosPeriodo(filtros.dataInicio, filtros.dataFim, filtros.pagina * LIMITE_PAGINA),
          ...(filtros.acao ? { acao: filtros.acao } : {}),
          ...(filtros.entidade ? { entidade: filtros.entidade } : {}),
        },
      });
      setDados(resposta.data);
    } catch (falha) {
      setErro(falha.response?.data?.detail || 'Não foi possível carregar os registros de auditoria.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, [api]);

  const aplicarFiltros = (evento) => {
    evento.preventDefault();
    if (Boolean(dataInicio) !== Boolean(dataFim)) {
      setErro('Informe as datas inicial e final juntas.');
      return;
    }
    const inicioIso = dataNascimentoParaIso(dataInicio);
    const fimIso = dataNascimentoParaIso(dataFim);
    if ((dataInicio && !inicioIso) || (dataFim && !fimIso)) {
      setErro('Informe datas válidas no formato DD/MM/AAAA.');
      return;
    }
    if (inicioIso && fimIso && fimIso < inicioIso) {
      setErro('A data final deve ser igual ou posterior à inicial.');
      return;
    }
    setPagina(0);
    carregarLogs({ dataInicio, dataFim, acao, entidade, pagina: 0 });
  };

  const mudarPagina = (novaPagina) => {
    setPagina(novaPagina);
    carregarLogs({ dataInicio, dataFim, acao, entidade, pagina: novaPagina });
  };

  return (
    <section className="audit-view" aria-labelledby="audit-title">
      <button type="button" className="audit-back-button" onClick={voltar}>Voltar ao menu</button>
      <div className="audit-heading">
        <div>
          <span className="eyebrow">RASTREABILIDADE</span>
          <h2 id="audit-title">Auditoria</h2>
        </div>
        <span className="audit-total">{dados.total.toLocaleString('pt-BR')} registros</span>
      </div>

      <form className="audit-filters" onSubmit={aplicarFiltros}>
        <label>
          De
          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={dataInicio} onChange={evento => setDataInicio(formatarDataNascimento(evento.target.value))} />
        </label>
        <label>
          Até
          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={dataFim} onChange={evento => setDataFim(formatarDataNascimento(evento.target.value))} />
        </label>
        <label>
          Ação
          <select value={acao} onChange={evento => setAcao(evento.target.value)}>
            <option value="">Todas</option>
            <option value="USUARIO_CRIADO">Usuário criado</option>
            <option value="USUARIO_ATIVADO">Usuário ativado</option>
            <option value="USUARIO_INATIVADO">Usuário inativado</option>
            <option value="PERFIL_ATUALIZADO">Perfil atualizado</option>
            <option value="LABORATORIO_CRIADO">Laboratório criado</option>
            <option value="LABORATORIO_ATIVADO">Laboratório ativado</option>
            <option value="LABORATORIO_INATIVADO">Laboratório inativado</option>
            <option value="RESERVA_APROVADA">Reserva aprovada</option>
            <option value="RESERVA_RECUSADA">Reserva recusada</option>
          </select>
        </label>
        <label>
          Entidade
          <select value={entidade} onChange={evento => setEntidade(evento.target.value)}>
            <option value="">Todas</option>
            <option value="USUARIO">Usuário</option>
            <option value="LABORATORIO">Laboratório</option>
            <option value="RESERVA">Reserva</option>
          </select>
        </label>
        <button type="submit" disabled={carregando} aria-busy={carregando}>
          {carregando ? <LoadingSpinner label="Filtrando..." inline /> : 'Aplicar filtros'}
        </button>
      </form>

      {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
      {carregando ? (
        <LoadingSpinner label="Carregando auditoria..." />
      ) : dados.logs.length === 0 ? (
        <p className="audit-empty">Nenhum registro encontrado.</p>
      ) : (
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th scope="col">Data e hora</th>
                <th scope="col">Responsável</th>
                <th scope="col">Ação</th>
                <th scope="col">Entidade</th>
                <th scope="col">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {dados.logs.map(log => (
                <tr key={log.id}>
                  <td>{formatarData(log.data_hora)}</td>
                  <td>{log.usuario_nome}<small>{log.usuario_perfil}</small></td>
                  <td>{log.acao.replaceAll('_', ' ')}</td>
                  <td>{log.entidade}<small>{log.entidade_id}</small></td>
                  <td>{log.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="audit-pagination" aria-label="Paginação da auditoria">
        <button type="button" onClick={() => mudarPagina(pagina - 1)} disabled={pagina === 0 || carregando}>
          Anterior
        </button>
        <span>Página {pagina + 1} de {Math.max(1, Math.ceil(dados.total / LIMITE_PAGINA))}</span>
        <button
          type="button"
          onClick={() => mudarPagina(pagina + 1)}
          disabled={carregando || (pagina + 1) * LIMITE_PAGINA >= dados.total}
        >
          Próxima
        </button>
      </div>
    </section>
  );
}