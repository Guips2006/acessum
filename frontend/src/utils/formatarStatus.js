const STATUS_LABELS = {
  ABERTO: 'Aberto',
  APROVADA: 'Aprovada',
  ATIVO: 'Ativo',
  CANCELADA: 'Cancelada',
  CONCLUIDA: 'Concluída',
  EM_USO: 'Em uso',
  INATIVO: 'Inativo',
  NO_SHOW: 'Não compareceu',
  PENDENTE: 'Pendente',
  RECUSADA: 'Recusada',
  RESOLVIDO: 'Resolvido',
  SUSPENSO: 'Suspensa',
};

const PERFIL_LABELS = {
  ADMINISTRADOR: 'Administrador',
  ALUNO: 'Aluno',
  PROFESSOR: 'Professor',
};

export function formatarStatus(status) {
  return STATUS_LABELS[status] || status;
}

export function formatarPerfil(perfil) {
  return PERFIL_LABELS[perfil] || perfil;
}
