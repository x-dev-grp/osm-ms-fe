export interface StatistiquesStock {
  totalArticles: number;
  articlesEnAlerte: number;
  valeurTotaleStock: number;
  tauxRupture: number;
  bonsEnAttente: number;
  delaiValidationMoyen: number;
  joursCouvertureMoyen?: number;
  bonsValidesMois?: number;
  montantAchatsMois?: number;
  mouvementsParMois?: Record<string, number>;
  alertesParCategorie?: Record<string, number>;
  achatsParFournisseur?: Record<string, number>;
}
