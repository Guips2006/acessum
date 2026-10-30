import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import RelatarProblema from './RelatarProblema';
import ConsultaDisponibilidade from './ConsultaDisponibilidade';
import SolicitarReserva from './SolicitarReserva';

export default function ConsultaRecursos({ voltar }) {
  const { api } = useContext(AuthContext);
  const [laboratorios, setLaboratorios] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [recursoEmRelato, setRecursoEmRelato] = useState(null);
  const [laboratorioEmConsulta, setLaboratorioEmConsulta] = useState(null);
  const [laboratorioParaReserva, setLaboratorioParaReserva] = useState(null);
  const [reservaEnviada, setReservaEnviada] = useState('');

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

  return (
    <section className="page-container">
      <button
        type="button"
        className="page-back-button"
        onClick={voltar}
      >
        ← Voltar ao Menu
      </button>
      <h2>Recursos Disponíveis</h2>
      {erro && <p role="alert">{erro}</p>}

      {carregando ? (
        <LoadingSpinner label="A carregar recursos..." />
      ) : erro ? null : laboratorios.length === 0 ? (
        <p>Nenhum laboratório cadastrado no momento.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {laboratorios.map(lab => {
            const equipamentos = lab.equipamentos || [];

          return (
            <article
              key={lab.id}
              className="page-card"
            >
              <h3 style={{ margin: '0 0 10px' }}>
                {lab.nome}
                <span className={`resource-status text-status-${lab.status === 'ATIVO' ? 'positive' : 'negative'}`} >
                  {lab.status}
                </span>
              </h3>
              <p style={{ margin: '0 0 15px', fontSize: '14px' }}>Capacidade: {lab.capacidade} lugares</p>
              {lab.status === 'ATIVO' && (
                <button
                  type="button"
                  onClick={() => setLaboratorioEmConsulta(laboratorioEmConsulta === lab.id ? null : lab.id)}
                  style={estiloBotaoDisponibilidade}
                >
                  {laboratorioEmConsulta === lab.id ? 'Fechar disponibilidade' : 'Consultar disponibilidade'}
                </button>
              )}
              {laboratorioEmConsulta === lab.id && (
                <ConsultaDisponibilidade laboratorio={lab} />
              )}
              {lab.status === 'ATIVO' && (
                <button
                  type="button"
                  onClick={() => {
                    setReservaEnviada('');
                    setLaboratorioParaReserva(laboratorioParaReserva === lab.id ? null : lab.id);
                  }}
                  style={{ ...estiloBotaoDisponibilidade, marginTop: '8px' }}
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
                    setReservaEnviada(`Solicitação registada para ${reserva.laboratorio_nome} com status ${reserva.status}.`);
                  }}
                />
              )}
              {reservaEnviada && <p role="status">{reservaEnviada}</p>}
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

              <h4 className="page-card-subheading">Equipamentos neste laboratório</h4>
              {equipamentos.length === 0 ? (
                <p className="empty-state">Sem equipamentos vinculados.</p>
              ) : (
                <div className="page-card-list">
                  {equipamentos.map(equipamento => (
                    <div
                      key={equipamento.id}
                      className="page-card-subsection"
                    >
                      <strong>{equipamento.nome}</strong>
                      {equipamento.descricao && <span> — {equipamento.descricao}</span>}
                      <span className={`resource-status text-status-${equipamento.status === 'ATIVO' ? 'positive' : 'negative'}`}>
                        {equipamento.status}
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

const estiloBotaoDisponibilidade = {
  marginRight: '8px',
  padding: '8px 12px',
  color: '#ffffff',
  backgroundColor: '#0056b3',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};