import {SupplierInfo} from '../../shared/models/supplier';
import {Customer} from "./Customer";

export interface WasteSale {
  id?: string; // optionnel si c’est une entité persistée
  type: WasteType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: Date;
  invoiceNumber: string;
  paid: boolean;
  paymentDate?: Date;
  storageLocationCode: string;
  customer: Customer; // UUID sous forme de string
  supplier: SupplierInfo;
  notes?: string;
  description: string;
}

export enum WasteType {
  MARGINE = 'MARGINE',
  POMACE = 'POMACE',
  VEGETAL_SOLIDS = 'VEGETAL_SOLIDS',
  OTHER = 'OTHER'
}


