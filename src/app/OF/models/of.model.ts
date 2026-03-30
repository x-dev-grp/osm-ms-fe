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
  ligneId?: string;
  ligneNom?: string;
  lotVracId?: string;
  lignes?: LigneOF[];
  qrUrl?: string;
  publicCode?: string;
  qrImageBase64?: string;
}


export enum StatutOF {
  BROUILLON = 'BROUILLON',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  CLOTURE = 'CLOTURE'
}
