import {LigneOF} from "./LigneOF";

export interface OrdreFabrication {
  id?: string;
  code?: string;
  statut: StatutOF;
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
  dateDebutReelle?: string;
  dateFinReelle?: string;
  quantiteCible: number;
  quantiteBonne?: number;
  quantiteNC?: number;
  dureeReelle?: number;
  skuId: string;
  bomId?: string;
  skuCode?: string;
  unite?: string;
  ligneId?: string;
  ligneNom?: string;
  lotVracId?: string;
  lignes?: LigneOF[];
  articleNom?: string;
  createdDate?: string;
  qrUrl?: string;
  publicCode?: string;
  qrImageBase64?: string;
  qualityStatus?: QualityStatus;
  projectId?: string;
  motifNC?: string;
}


export enum StatutOF {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  CLOTURE = 'CLOTURE',
  EN_ATTENTE = 'EN_ATTENTE',
ANNULE = 'ANNULE'
}
export enum  QualityStatus {
  FREE = 'FREE',
  BLOCKED = 'BLOCKED',
}
