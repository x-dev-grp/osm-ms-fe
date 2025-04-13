import { BaseType } from './BaseType';
import { Transporter } from './Transporter';
import { SupplierType } from './SupplierType';
import { DeliveryType } from './deleveryType';

export interface Delivery {
  id?: string;
  receiptNumber?: string;
  deliveryNumber?: string;
  deliveryType?: DeliveryType;
  lotNumber?: string;
  deliveryDate?: string; // Utiliser string pour LocalDateTime
  trtDate?: string;
  // status?: OliveLotStatus;

  globalLotNumber?: string;
  oliveQuantity?: number;
  oilQuantity?: number;
  sackCount?: number;

  region?: BaseType;
  transporter?: Transporter;
  oliveVariety?: BaseType;
  oliveType?: BaseType;
  oilType?: BaseType;
  oilVariety?: BaseType;
  productionMethod?: BaseType;

  supplierType?: SupplierType;

  unitPrice?: number;
  price?: number;
  tierOrBase?: string;
  parcel?: string;

  // qualityControlResults?: QualityControlResultDto[];
}
