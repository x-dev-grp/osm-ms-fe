
import { Supplier } from '../models/Supplier';
import { BaseType} from "./BaseType";
import { QualityControlResult } from "./QualityControlResult";

export interface UnifiedDelivery {
  // --- Champs communs ---
  deliveryNumber: string;
  deliveryType: DeliveryType;
  lotNumber: string;
  deliveryDate: Date;

  region: BaseType;
  poidsBrute: number;
  poidsNet: number;
  matriculeCamion: string;
  etatCamion: string;
  supplier: Supplier;
  qualityControlResults: QualityControlResult[];

  // --- Champs spécifiques à l'huile ---
  globalLotNumber: string;
  oilVariety: BaseType;
  oilQuantity: number;
  unitPrice: number;
  price: number;
  paidAmount: number;
  unpaidAmount: number;
  oilType: BaseType;

  // --- Champs spécifiques à l’olive ---
  trtDate: Date;
  operationType: OperationType;
  oliveVariety: BaseType;
  sackCount: number;
  oliveType: BaseType;
  status: OliveLotStatus;
  rendement: number;
  oliveQuantity: number;
  parcel: string;
}

// enums.ts

export enum DeliveryType {
  OLIVE = "OLIVE",
  HUILED = "HUILED",
}
export enum OperationType {
  ACHAT = 'ACHAT',
  CHANGEMENT = 'CHANGEMENT',

}

export enum OliveLotStatus {
  BON = 'BON',
  ACCEPTABLE = 'ACCEPTABLE',
  MAUVAIS = 'MAUVAIS',
}

