// Corps envoyé lors de la clôture (completion) d’une opération.
// PUT /{operationId}/complete
export interface FiltrationCompletion {
  // Volume réel après filtration (litres).
  // Obligatoire quand on termine l’opération.
  volumeAfter: number;

  // Note optionnelle (ex: incident, observation, qualité, etc.)
  note?: string | null;
}
