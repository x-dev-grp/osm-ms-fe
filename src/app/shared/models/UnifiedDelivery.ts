import {QualityControlResult} from "../../reception/models/QualityControlResult";
import { BaseType } from './base-type';
import { Supplier } from './supplier';
import { StorageUnitDto } from './StorageUnitDto';
import { MillMachine } from './millMachine';
import { Transporter } from './Transporter';
import { OliveLotStatus } from './OliveLotStatus';
import { deliveryType } from '../../osm/models/deleveryType';

export class UnifiedDelivery {
  deliveryNumber!: string;
  deliveryType!: string;
  lotNumber!: string;
  deliveryDate!: Date;
  region!: string;
  poidsBrute!: number;
  poidsNet!: number;
  matriculeCamion!: string;
  etatCamion!: string;
  supplier!: Supplier;
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
  oliveType?: BaseType| null;
  status?: OliveLotStatus | null;
  rendement?: number | null;
  oliveQuantity?: number | null;
  parcel?: string | null;
}
