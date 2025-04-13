// delivery.dto.ts

import { BaseType } from './base-type';
 import { QualityControlResultDto } from './QualityControlResultDto';
import { StorageUnitDto } from './StorageUnitDto';
import { MillMachine } from './millMachine';
import { Transporter } from './Transporter';
import { deliveryType } from './deleveryType';
import { OliveLotStatus } from './OliveLotStatus';
import { SupplierType } from './supplier-type';

export interface Delivery {
  millingMachine?: MillMachine;
  id?: string;
  receiptNumber?: string;
  lotNumber?: string;
  deliveryDate?: string;
  trtDate?: string; // Date de TRT (Trituration Date)
  status?: OliveLotStatus;
  deliveryType:deliveryType;
  storageUnit?: StorageUnitDto;
  globalLotNumber?: string;
  oliveQuantity?: number;
  oilQuantity?: number;
  deliveryNumber?: string;
  rendement?: number;

  unitPrice?: number;
  price?: number;
  paidAmount?: number;
  unpaidAmount?: number;

  region?: BaseType;
  olivType?: BaseType;
  oliveVariety?: BaseType;
  oilVariety?: BaseType; // optional, not used in form but keep it
  oilType?: BaseType;    // Biologique / Conventionnelle
  supplierType?: SupplierType;
  tierOrBase?: string;
  parcel?: string;

  qualityControlResults: QualityControlResultDto[];
  sackCount?: number;
  transporter?: Transporter;
}


// Supporting nested DTO interfaces:

// Enum matching your backend OliveLotStatus:

