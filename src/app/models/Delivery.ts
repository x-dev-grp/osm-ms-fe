import {Region} from "./generic/region";
import {Supplier} from "./supplier";
import {QualityControlResultDto} from "./QualityControlResultDto";
import {OliveVarietyTypeDto} from "./generic/OliveVarietyTypeDto";

export interface Delivery {
  id?: number;
  receiptNumber: string;
  lotNumber: string;
  deliveryDate: string; // ISO string representing the Instant
  status: string;       // You can also define an enum for OliveLotStatus if desired
  globalLotNumber: string;
  oliveQuantity: number;
  oilQuantity: number;
  region: Region | null;
  oliveVariety: OliveVarietyTypeDto | null;
  storageUnit: string;
  supplier: Supplier | null;
  unitPrice: number;
  price: number;
  paidAmount: number;
  unpaidAmount: number;
  qualityControlResults: QualityControlResultDto[]; // Updated to an array of QualityControlResultDto
}
