import { Supplier } from '../models/Supplier';
import { BaseType } from './BaseType';
import { QualityControlResult } from './QualityControlResult';
import { OliveLotStatus } from '../../shared/models/OliveLotStatus';
import { DeliveryType } from './deleveryType';

export interface UnifiedDelivery {
  id?: string;
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
  operationType: BaseType;
  oliveVariety: BaseType;
  sackCount: number;
  oliveType: BaseType;
  status: OliveLotStatus;
  rendement: number;
  oliveQuantity: number;
  parcel: string;
}

// enums.ts



