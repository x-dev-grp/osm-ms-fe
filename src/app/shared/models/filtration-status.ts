// Filtration statuses must match backend enum values.
// Backend enum: CREATED, IN_PROGRESS, COMPLETED, CANCELLED :contentReference[oaicite:1]{index=1}
export type FiltrationStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const FILTRATION_STATUS_LABEL: Record<FiltrationStatus, string> = {
  CREATED: 'Créée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};
