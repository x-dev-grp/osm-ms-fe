 import {VarietyDto} from "./VarietyDto";
 import {Region} from "./region";
 import {Supplier} from "./supplier";
 import {QualityControlResultDto} from "./QualityControlResultDto";

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
   variety: VarietyDto | null;
   storageUnit: string;
   supplier: Supplier | null;
   unitPrice: number;
   price: number;
   paidAmount: number;
   unpaidAmount: number;
  qualityControlResult: { [key: string]: QualityControlResultDto } ;
 }
