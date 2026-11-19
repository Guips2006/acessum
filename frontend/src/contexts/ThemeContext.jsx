import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const PREFERENCIAS_TEMA_KEY = 'acessum-preferencias-tema';

function lerPreferencias() {
  try {
    const preferencias = JSON.parse(localStorage.getItem(PREFERENCIAS_TEMA_KEY) || '{}');
    return {
      modoEscuro: preferencias.modoEscuro === true,
      altoContraste: preferencias.altoContraste === true,
    };
  } catch {
    return { modoEscuro: false, altoContraste: false };
  }
}

export function ThemeProvider({ children }) {
  const [preferencias, setPreferencias] = useState(lerPreferencias);
  const tema = preferencias.altoContraste
    ? 'high-contrast'
    : preferencias.modoEscuro
      ? 'dark'
      : 'light';

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.dataset.contraste = preferencias.altoContraste ? 'alto' : 'normal';
    localStorage.setItem(PREFERENCIAS_TEMA_KEY, JSON.stringify(preferencias));
  }, [preferencias, tema]);

  const alternarModoEscuro = () => {
    setPreferencias(atual => ({ ...atual, modoEscuro: !atual.modoEscuro }));
  };

  const alternarAltoContraste = () => {
    setPreferencias(atual => ({ ...atual, altoContraste: !atual.altoContraste }));
  };

  const alternarTema = () => {
    setPreferencias(atual => {
      const temaAtual = atual.altoContraste
        ? 'high-contrast'
        : atual.modoEscuro
          ? 'dark'
          : 'light';
      const proximoTema = {
        light: 'dark',
        dark: 'high-contrast',
        'high-contrast': 'light',
      }[temaAtual];
      return {
        modoEscuro: proximoTema === 'dark',
        altoContraste: proximoTema === 'high-contrast',
      };
    });
  };

  return (
    <ThemeContext.Provider value={{ ...preferencias, tema, alternarModoEscuro, alternarAltoContraste, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }
  return contexto;
}