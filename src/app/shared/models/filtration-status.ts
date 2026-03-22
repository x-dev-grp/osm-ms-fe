// Filtration statuses must match backend enum values.
// Backend enum: CREATED, IN_PROGRESS, COMPLETED, CANCELLED :contentReference[oaicite:1]{index=1}
export type FiltrationStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const FILTRATION_STATUS_LABEL: Record<FiltrationStatus, string> = {
  CREATED: 'Created',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
