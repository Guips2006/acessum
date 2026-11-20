import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

export default function Configuracoes({ voltar }) {
  const { modoEscuro, altoContraste, alternarModoEscuro, alternarAltoContraste } = useTheme();

  return (
    <section className="settings-view" aria-labelledby="settings-title">
      <button type="button" className="settings-back-button" onClick={voltar}>
        Voltar ao menu
      </button>
      <h2 id="settings-title">Configurações de acessibilidade</h2>
      <p className="settings-description">As preferências ficam salvas neste dispositivo.</p>

      <div className="settings-options">
        <label className="settings-option">
          <span>
            <strong>Alto contraste</strong>
            <small>Aumenta a distinção entre texto, fundo e controles.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={altoContraste}
            onChange={alternarAltoContraste}
            aria-label="Ativar alto contraste"
          />
        </label>
        <div className="settings-option">
          <span>
            <strong>Modo escuro</strong>
            <small>Usa superfícies escuras nas telas do sistema.</small>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={modoEscuro}
            onClick={alternarModoEscuro}
            className="theme-mode-toggle"
            aria-label={modoEscuro ? 'Modo escuro ativado' : 'Modo claro ativado'}
            title={modoEscuro ? 'Modo escuro' : 'Modo claro'}
          >
            {modoEscuro ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}
            <span>{modoEscuro ? 'Escuro' : 'Claro'}</span>
          </button>
        </div>
      </div>

    </section>
  );
}