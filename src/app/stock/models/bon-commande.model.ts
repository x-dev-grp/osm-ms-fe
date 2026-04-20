import { LigneBonCommande } from "./ligne-bon-commande.model";

export interface BonCommande {
  id?: string;
  numeroBC: string;
  motifRefus?: string;
  dateValidation?: Date;
  dateReceptionPrevue?: Date;
  status: StatutBonCommande;
  lignes: LigneBonCommande[];
  createdDate?: string;
  fournisseurNom?: string;
}

export enum StatutBonCommande {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  RECU = 'RECU',
  PARTIELLEMENT_RECU = 'PARTIELLEMENT_RECU',
  REFUSE = 'REFUSE'
}
