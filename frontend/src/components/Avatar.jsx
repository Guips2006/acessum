import React, { useEffect, useState } from 'react';

function resolverFonte(src, baseUrl) {
  if (typeof src !== 'string' || !src.trim()) return '';
  try {
    const url = new URL(src, baseUrl || 'http://localhost');
    return ['http:', 'https:', 'blob:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).map(parte => parte[0].toLocaleUpperCase()).join('') || 'U';
}

export default function Avatar({ nome, src, baseUrl, className = '' }) {
  const fonte = resolverFonte(src, baseUrl);
  const [fonteComFalha, setFonteComFalha] = useState('');

  useEffect(() => {
    setFonteComFalha('');
  }, [fonte]);

  const mostrarImagem = fonte && fonte !== fonteComFalha;

  return (
    <span
      className={`avatar ${className}`.trim()}
      role="img"
      aria-label={`Foto de ${nome || 'usuário'}`}
    >
      {mostrarImagem ? (
        <img
          className="avatar-image"
          src={fonte}
          alt=""
          onError={() => setFonteComFalha(fonte)}
        />
      ) : (
        <span className="avatar-fallback" aria-hidden="true">{iniciais(nome)}</span>
      )}
    </span>
  );
}
