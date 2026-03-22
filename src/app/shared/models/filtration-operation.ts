import { FiltrationStatus } from './filtration-status';
import { StorageUnitDto } from './StorageUnitDto';

// Modèle UI représentant une opération telle que renvoyée par le backend (FiltrationResultDto).
// Il sert à remplir le tableau (liste) et à afficher les détails dans les dialogues.
export interface FiltrationOperation {
  operationId: string;

  // IDs des cuves source et destination (UUID).
  source: StorageUnitDto;
  target: StorageUnitDto;

  // Volume filtré demandé/traité (en litres).
  volumeFiltered: number;

  // Résultats après filtration (peuvent être null tant que l’opération n’est pas terminée).
  volumeAfter?: number | null;
  lossVolume?: number | null;
  lossPercent?: number | null;

  // Statut de l’opération.
  // Le backend renvoie souvent un string, donc on accepte FiltrationStatus | string.
  status: FiltrationStatus | string;

  // Date/heure de création (ISO string).
  timestamp: string;

  // Note optionnelle (historique ou commentaire).
  note?: string | null;
}
