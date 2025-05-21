export interface BonModel {
  template?: 'standard';

  entete: {
    logo?: string; // URL ou base64 du logo
    titre: string;
    sousTitre: string;
    reference?: string | null;
    date?: string;
    page?: string;
    revision?: string;
  };

  body: {
    informationsGenerales: {
      numeroReception: string | null;
      date: string | null;
      fournisseur: string | null;
      telephone: string | null;
      numeroLot: string | null;
      type: string | null;
    };
    table?: {
      colonnes?: string[];
      lignes?: (string | number)[][];
    };
  };

  pied?: {
    signatures?: string[];
  };
}
