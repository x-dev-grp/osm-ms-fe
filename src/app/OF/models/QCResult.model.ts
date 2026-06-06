export interface QCResult {
  id?: string;
  controlPointId: string;
  ofId: string;
  valeur: string;
  statut?: 'OK' | 'NOK';
  commentaire?: string;
  photo?: string;        // base64 ou URL
  signature?: string;
  dateControle?: Date;

  createdDate?: string;
}
