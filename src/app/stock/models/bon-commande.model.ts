import { LigneBonCommande } from "./ligne-bon-commande.model";

export interface BonCommande {
  id?: string;
  numeroBC: string;
  fournisseur: string;
  motifRefus?: string;
  dateValidation?: Date;
  dateReceptionPrevue?: Date;
  status: StatutBonCommande;
  lignes: LigneBonCommande[];
}

export enum StatutBonCommande {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  RECU = 'RECU',
  PARTIELLEMENT_RECU = 'PARTIELLEMENT_RECU',
  ANNULE = 'ANNULE',
  REFUSE = 'REFUSE'
}
