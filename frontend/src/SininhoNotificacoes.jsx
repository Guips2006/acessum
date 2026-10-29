import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

const INTERVALO_ATUALIZACAO = 30_000;

export default function SininhoNotificacoes() {
  const { api } = useContext(AuthContext);
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const resposta = await api.get('/api/notificacoes');
        if (!ativo) return;
        setNotificacoes(resposta.data.notificacoes);
        setNaoLidas(resposta.data.nao_lidas);
        setErro('');
      } catch {
        if (ativo) setErro('Não foi possível carregar as notificações.');
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    const intervalo = window.setInterval(carregar, INTERVALO_ATUALIZACAO);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [api]);

  const marcarComoLida = async (notificacao) => {
    if (notificacao.lida) return;
    try {
      const resposta = await api.patch(`/api/notificacoes/${notificacao.id}/lida`);
      setNotificacoes(atual => atual.map(item => (
        item.id === notificacao.id ? resposta.data : item
      )));
      setNaoLidas(atual => Math.max(0, atual - 1));
    } catch {
      setErro('Não foi possível atualizar essa notificação.');
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!naoLidas) return;
    try {
      await api.patch('/api/notificacoes/lidas');
      setNotificacoes(atual => atual.map(item => ({ ...item, lida: true })));
      setNaoLidas(0);
    } catch {
      setErro('Não foi possível marcar as notificações como lidas.');
    }
  };

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-bell"
        onClick={() => setAberto(atual => !atual)}
        aria-label={`Notificações${naoLidas ? `, ${naoLidas} não lidas` : ''}`}
        aria-expanded={aberto}
        aria-controls="notifications-panel"
        title="Notificações"
      >
        <span aria-hidden="true">🔔</span>
        {naoLidas > 0 && <span className="notification-count" aria-hidden="true">{naoLidas > 99 ? '99+' : naoLidas}</span>}
      </button>

      {aberto && (
        <section className="notifications-panel" id="notifications-panel" aria-label="Notificações recentes">
          <div className="notifications-panel-heading">
            <h2>Notificações</h2>
            <button type="button" className="notifications-close" onClick={() => setAberto(false)} aria-label="Fechar notificações">
              ×
            </button>
          </div>
          {naoLidas > 0 && (
            <button type="button" className="notifications-mark-all" onClick={marcarTodasComoLidas}>
              Marcar todas como lidas
            </button>
          )}
          {erro && <p className="feedback feedback-error" role="alert">{erro}</p>}
          {carregando ? (
            <LoadingSpinner label="Carregando notificações..." />
          ) : notificacoes.length === 0 ? (
            <p className="notifications-empty">Nenhuma notificação.</p>
          ) : (
            <ul className="notifications-list">
              {notificacoes.map(notificacao => (
                <li key={notificacao.id} className={notificacao.lida ? '' : 'is-unread'}>
                  <button type="button" onClick={() => marcarComoLida(notificacao)}>
                    <span className="notification-unread-mark" aria-hidden="true" />
                    <span className="notification-copy">
                      <strong>{notificacao.titulo}</strong>
                      <span>{notificacao.mensagem}</span>
                      <time dateTime={notificacao.criada_em}>
                        {new Date(notificacao.criada_em).toLocaleString('pt-BR')}
                      </time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}