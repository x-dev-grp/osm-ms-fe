// delivery.dto.ts

import { BaseType } from './base-type';
import { Supplier } from './supplier';
import { QualityControlResultDto } from './QualityControlResultDto';
import { StorageUnitDto } from './StorageUnitDto';
import { MillMachine } from './millMachine';

export interface Delivery {
  millingMachine?: MillMachine;
  id?: string;
  receiptNumber?: string;
  lotNumber?: string;
  deliveryDate?: string;
  trtDate?: string; // Date de TRT (Trituration Date)
  status?: string;

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
  oliveVariety?: BaseType;
  oilVariety?: BaseType; // optional, not used in form but keep it
  oilType?: BaseType;    // Biologique / Conventionnelle
  supplier?: Supplier;
  tierOrBase?: string;
  parcel?: string;

  qualityControlResults?: QualityControlResultDto[];
}


// Supporting nested DTO interfaces:

// Enum matching your backend OliveLotStatus:
export enum OliveLotStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
  // Add other statuses as per your backend
}
