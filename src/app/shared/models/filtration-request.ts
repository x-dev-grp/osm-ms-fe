// Corps minimal envoyé lors de la création d’une opération.
// POST /api/production/filtration
export interface FiltrationRequest {
  // UUID de la cuve source.
  source: string;

  // UUID de la cuve cible.
  target: string;

  // Volume à filtrer (litres).
  volumeToFilter: number;

  // Note optionnelle ajoutée à la création.
  note?: string | null;
}
