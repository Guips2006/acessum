import React from 'react';

export default function LoadingSpinner({ label, inline = false, large = false, visuallyHiddenLabel = false }) {
  return (
    <span className={`loading-indicator${inline ? ' loading-indicator-inline' : ''}${large ? ' loading-indicator-large' : ''}`} role="status">
      <span className="loading-indicator-ring" aria-hidden="true" />
      <span className={visuallyHiddenLabel ? 'visually-hidden-label' : ''}>{label}</span>
    </span>
  );
}