 import { BaseType } from './base-type';
import { OliveLotStatus } from './OliveLotStatus';
 import { SupplierType } from './supplier-type';

export class UnifiedDelivery {
 id!:string;
 deliveryNumber!: string;
  deliveryType!: string;
  lotNumber!: string;
  deliveryDate!: Date;
  region!: string;
  poidsBrute!: number;
  poidsNet!: number;
  matriculeCamion!: string;
  etatCamion!: string;
  supplier!: SupplierType;
  globalLotNumber?: string | null;
  oilVariety?: BaseType | null;
  oilQuantity?: number | null;
  unitPrice?: number | null;
  price?: number | null;
  paidAmount?: number | null;
  unpaidAmount?: number | null;
  oilType?: BaseType | null;
  trtDate?: Date | null;
  operationType?: BaseType | null;
  oliveVariety?: BaseType | null;
  sackCount?: number | null;
  oliveType: BaseType ;
  status?: OliveLotStatus | null;
  rendement?: number | null;
  oliveQuantity?: number | null;
  parcel?: string | null;
}
