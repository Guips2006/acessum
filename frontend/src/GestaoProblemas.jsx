import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function GestaoProblemas({ voltar }) {
  const { api } = useContext(AuthContext);
  const [relatos, setRelatos] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [relatoEmAtualizacao, setRelatoEmAtualizacao] = useState(null);

  const carregarRelatos = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await api.get('/api/problemas/');
      setRelatos(response.data);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar relatos de problemas.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRelatos();
  }, [api]);

  const atualizarStatus = async (relato) => {
    const novoStatus = relato.status === 'ABERTO' ? 'RESOLVIDO' : 'ABERTO';
    setErro('');
    setSucesso('');
    setRelatoEmAtualizacao(relato.id);
    try {
      await api.patch(`/api/problemas/${relato.id}/status`, { status: novoStatus });
      setSucesso(`Relato atualizado para ${novoStatus}.`);
      await carregarRelatos();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao atualizar o relato.');
    } finally {
      setRelatoEmAtualizacao(null);
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
      <h2>Relatos de Problemas</h2>
      {erro && <p role="alert" style={{ color: '#dc3545' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#28a745' }}>{sucesso}</p>}

      {carregando ? (
        <LoadingSpinner label="A carregar relatos..." />
      ) : relatos.length === 0 ? (
        <p>Nenhum problema reportado.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {relatos.map(relato => (
            <article
              key={relato.id}
              style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              <h3 style={{ margin: '0 0 8px' }}>{relato.recurso_nome}</h3>
              <p style={{ margin: '4px 0' }}>Recurso: {relato.tipo_recurso === 'LABORATORIO' ? 'Laboratório' : 'Equipamento'}</p>
              <p style={{ margin: '4px 0' }}>Relatado por: {relato.usuario_nome}</p>
              <p style={{ margin: '4px 0' }}>Data: {new Date(relato.data_hora).toLocaleString()}</p>
              <p style={{ margin: '8px 0' }}>{relato.descricao}</p>
              <p style={{ margin: '4px 0' }}>
                Severidade: <strong>{rotuloSeveridade[relato.nivel_severidade]}</strong>
              </p>
              <p style={{ margin: '4px 0 12px', color: relato.status === 'ABERTO' ? '#9a5700' : '#28a745', fontWeight: 'bold' }}>
                Status: {relato.status}
              </p>
              <button
                type="button"
                onClick={() => atualizarStatus(relato)}
                disabled={relatoEmAtualizacao === relato.id}
                aria-busy={relatoEmAtualizacao === relato.id}
                style={{
                  padding: '10px 14px',
                  color: '#ffffff',
                  backgroundColor: relato.status === 'ABERTO' ? '#13835b' : '#9a5700',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {relatoEmAtualizacao === relato.id
                  ? <LoadingSpinner label="A atualizar..." inline />
                  : relato.status === 'ABERTO' ? 'Marcar como resolvido' : 'Reabrir relato'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const rotuloSeveridade = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
};
