import React, { useContext, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function FavoritosProfessor({ explorarRecursos }) {
  const { api } = useContext(AuthContext);
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    api.get('/api/favoritos')
      .then(resposta => {
        if (ativo) setFavoritos(resposta.data);
      })
      .catch(falha => {
        if (ativo) {
          setErro(falha.response?.data?.detail || 'Não foi possível carregar seus laboratórios favoritos.');
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => { ativo = false; };
  }, [api]);

  return (
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
      {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
      {carregando ? (
        <LoadingSpinner label="Carregando favoritos..." />
      ) : favoritos.length === 0 ? (
        <p className="aluno-favoritos-empty">
          Você ainda não favoritou nenhum laboratório. Explore os recursos para adicionar seus espaços preferidos.
        </p>
      ) : (
        <div className="aluno-favoritos-grid">
          {favoritos.map(laboratorio => (
            <article className="aluno-favorito-card" key={laboratorio.id}>
              <div className="aluno-favorito-title">
                <Star size={18} fill="currentColor" aria-hidden="true" />
                <h3>{laboratorio.nome}</h3>
              </div>
              <p>Capacidade: {laboratorio.capacidade} lugares</p>
              {laboratorio.status !== 'ATIVO' && (
                <p className="aluno-favorito-inativo">Este laboratório está indisponível para novas reservas.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
