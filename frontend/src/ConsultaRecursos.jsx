import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import RelatarProblema from './RelatarProblema';
import ConsultaDisponibilidade from './ConsultaDisponibilidade';
import SolicitarReserva from './SolicitarReserva';
import GradeSemanal from './GradeSemanal';
import { formatarStatus } from './utils/formatarStatus';

export default function ConsultaRecursos({ voltar }) {
  const { api, user } = useContext(AuthContext);
  const [laboratorios, setLaboratorios] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [recursoEmRelato, setRecursoEmRelato] = useState(null);
  const [laboratorioEmConsulta, setLaboratorioEmConsulta] = useState(null);
  const [laboratorioParaReserva, setLaboratorioParaReserva] = useState(null);
  const [reservaEnviada, setReservaEnviada] = useState('');
  const [favoritos, setFavoritos] = useState(() => new Set());
  const [favoritoEmAtualizacao, setFavoritoEmAtualizacao] = useState(null);
  const [erroFavoritos, setErroFavoritos] = useState('');
  const [laboratorioNaGrade, setLaboratorioNaGrade] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro('');
        const response = await api.get('/api/laboratorios/');
        setLaboratorios(response.data);
      } catch (err) {
        setErro(err.response?.data?.detail || 'Erro ao carregar os recursos do servidor.');
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [api]);

  useEffect(() => {
    if (!['ALUNO', 'PROFESSOR'].includes(user.perfil)) return;
    let ativa = true;
    api.get('/api/favoritos')
      .then(response => {
        if (ativa) setFavoritos(new Set(response.data.map(favorito => favorito.id)));
      })
      .catch(err => {
        if (ativa) {
          setErroFavoritos(err.response?.data?.detail || 'Não foi possível carregar seus favoritos.');
        }
      });
    return () => { ativa = false; };
  }, [api, user.perfil]);

  const alternarFavorito = async (laboratorio) => {
    setErroFavoritos('');
    setFavoritoEmAtualizacao(laboratorio.id);
    try {
      if (favoritos.has(laboratorio.id)) {
        await api.delete(`/api/favoritos/${laboratorio.id}`);
        setFavoritos(atual => {
          const proximos = new Set(atual);
          proximos.delete(laboratorio.id);
          return proximos;
        });
      } else {
        await api.put(`/api/favoritos/${laboratorio.id}`);
        setFavoritos(atual => new Set(atual).add(laboratorio.id));
      }
    } catch (err) {
      setErroFavoritos(err.response?.data?.detail || 'Não foi possível atualizar seus favoritos.');
    } finally {
      setFavoritoEmAtualizacao(null);
    }
  };

  const laboratoriosOrdenados = [
    ...laboratorios.filter(laboratorio => favoritos.has(laboratorio.id)),
    ...laboratorios.filter(laboratorio => !favoritos.has(laboratorio.id)),
  ];

  return (
    <section className="resource-view content-page" aria-labelledby="resources-title">
      <button
        type="button"
        className="content-back-button"
        onClick={voltar}
      >
        ← Voltar ao Menu
      </button>
      <h2 id="resources-title">Recursos Disponíveis</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {erroFavoritos && <p className="feedback feedback-error" role="alert">{erroFavoritos}</p>}

      {carregando ? (
        <LoadingSpinner label="Carregando recursos..." />
      ) : erro ? null : laboratorios.length === 0 ? (
        <p>Nenhum laboratório cadastrado no momento.</p>
      ) : (
        <div className="content-card-list">
          {laboratoriosOrdenados.map(lab => {
            const equipamentos = lab.equipamentos || [];

          return (
            <article
              key={lab.id}
              className="resource-card"
            >
              <div className="resource-card-heading">
                <h3>
                  {lab.nome}
                  <span className={`resource-status ${lab.status === 'ATIVO' ? 'is-active' : 'is-inactive'}`}>
                    {lab.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </span>
                </h3>
                {['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
                  <button
                    type="button"
                    className={`favorite-toggle${favoritos.has(lab.id) ? ' is-favorite' : ''}`}
                    onClick={() => alternarFavorito(lab)}
                    disabled={favoritoEmAtualizacao === lab.id}
                    aria-label={`${favoritos.has(lab.id) ? 'Remover' : 'Adicionar'} ${lab.nome} ${favoritos.has(lab.id) ? 'dos' : 'aos'} favoritos`}
                    aria-pressed={favoritos.has(lab.id)}
                    aria-busy={favoritoEmAtualizacao === lab.id}
                  >
                    {favoritos.has(lab.id) ? '★' : '☆'}
                  </button>
                )}
              </div>
              <p style={{ margin: '0 0 15px', fontSize: '14px' }}>Capacidade: {lab.capacidade} lugares</p>
              {lab.status === 'ATIVO' && (
                <div className="resource-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setLaboratorioEmConsulta(laboratorioEmConsulta === lab.id ? null : lab.id)}
                  >
                    {laboratorioEmConsulta === lab.id ? 'Fechar disponibilidade' : 'Consultar disponibilidade'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setLaboratorioNaGrade(lab)}
                  >
                    Ver grade semanal
                  </button>
                </div>
              )}
              {laboratorioEmConsulta === lab.id && (
                <ConsultaDisponibilidade laboratorio={lab} />
              )}
              {lab.status === 'ATIVO' && (
                <button
                  type="button"
                  className="button-primary resource-reserve-button"
                  onClick={() => {
                    setReservaEnviada('');
                    setLaboratorioParaReserva(laboratorioParaReserva === lab.id ? null : lab.id);
                  }}
                >
                  {laboratorioParaReserva === lab.id ? 'Fechar formulário' : 'Solicitar reserva'}
                </button>
              )}
              {laboratorioParaReserva === lab.id && (
                <SolicitarReserva
                  laboratorio={lab}
                  fechar={() => setLaboratorioParaReserva(null)}
                  solicitada={reserva => {
                    setLaboratorioParaReserva(null);
                    setReservaEnviada(`Solicitação registrada para ${reserva.laboratorio_nome} com status ${formatarStatus(reserva.status)}.`);
                  }}
                />
              )}
              {reservaEnviada && <p role="status" style={{ color: '#28a745' }}>{reservaEnviada}</p>}
              <button
                type="button"
                onClick={() => setRecursoEmRelato({ tipo: 'LABORATORIO', id: lab.id, nome: lab.nome })}
                style={estiloBotaoProblema}
              >
                ⚠️ Relatar problema
              </button>
              {recursoEmRelato?.tipo === 'LABORATORIO' && recursoEmRelato.id === lab.id && (
                <RelatarProblema
                  tipoRecurso="LABORATORIO"
                  recursoId={lab.id}
                  recursoNome={lab.nome}
                  fechar={() => setRecursoEmRelato(null)}
                />
              )}

              <h4 style={{ margin: '0 0 10px', fontSize: '15px' }}>Equipamentos neste laboratório</h4>
              {equipamentos.length === 0 ? (
                <p style={{ margin: 0, fontSize: '14px', color: '#666666' }}>Sem equipamentos vinculados.</p>
              ) : (
                <div className="resource-equipment-list">
                  {equipamentos.map(equipamento => (
                    <div key={equipamento.id} className="resource-equipment-card">
                      <strong>{equipamento.nome}</strong>
                      {equipamento.descricao && <span> — {equipamento.descricao}</span>}
                      <span style={{ display: 'block', marginTop: '4px', color: equipamento.status === 'ATIVO' ? '#28a745' : '#dc3545' }}>
                        {equipamento.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecursoEmRelato({ tipo: 'EQUIPAMENTO', id: equipamento.id, nome: equipamento.nome })}
                        style={{ ...estiloBotaoProblema, marginTop: '10px' }}
                      >
                        ⚠️ Relatar problema
                      </button>
                      {recursoEmRelato?.tipo === 'EQUIPAMENTO' && recursoEmRelato.id === equipamento.id && (
                        <RelatarProblema
                          tipoRecurso="EQUIPAMENTO"
                          recursoId={equipamento.id}
                          recursoNome={equipamento.nome}
                          fechar={() => setRecursoEmRelato(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
          })}
        </div>
      )}
      {laboratorioNaGrade && (
        <GradeSemanal
          laboratorio={laboratorioNaGrade}
          fechar={() => setLaboratorioNaGrade(null)}
        />
      )}
    </section>
  );
}

const estiloBotaoProblema = {
  padding: '8px 12px',
  color: '#ffffff',
  backgroundColor: '#9a5700',
  border: '1px solid #874b00',
  borderRadius: '8px',
  cursor: 'pointer',
};
