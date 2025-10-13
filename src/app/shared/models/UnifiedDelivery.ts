import {BaseType} from './base-type';
import {OliveLotStatus} from './OliveLotStatus';
import {SupplierType} from './supplier-type';
import {StorageUnitDto} from './StorageUnitDto';
import {QualityControlResultDto} from './QualityControlResultDto';
import { OperationType } from './operation-type.enum';
import { Olive_Oil_Type } from './olive-type.enum';


export class UnifiedDelivery {
  id!: string;
  deliveryNumber!: string;
  description?: string;
  deliveryType!: string;
  lotNumber!: string;
  deliveryDate!: Date;
  region!: BaseType | null;
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
  oilType?: Olive_Oil_Type | null;
  trtDate?: Date | null;
  operationType?: OperationType ;
  oliveVariety?: BaseType | null;
  sackCount?: number | null;
  oliveType?: Olive_Oil_Type | null;
  status?: OliveLotStatus | null;
  rendement?: number | null;
  oliveQuantity?: number | null;
  poidsCamionVide?: number | null;
  parcel?: BaseType | null;
  storageUnit?: StorageUnitDto | null;
  qualityControlResults?: QualityControlResultDto[] | null;
  categoryOliveOil?: string;
  lotOliveNumber?: string| null;

}



