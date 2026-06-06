import { FiltrationStatus } from './filtration-status';

// Corps envoyé lors d’un changement de statut.
// PUT /{operationId}/status
export interface UpdateFiltrationStatus {
  // Nouveau statut.
  status: FiltrationStatus;

  // Note optionnelle : le backend l’ajoute en historique (append).
  note?: string | null;
}
