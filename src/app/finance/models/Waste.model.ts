import {SupplierInfo} from '../../shared/models/supplier';
 import { SupplierType } from '../../shared/models/supplier-type';

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
   supplier: SupplierType;
  notes?: string;
  description: string;
}

export enum WasteType {
  MARGINE = 'MARGINE',
  POMACE = 'POMACE',
  VEGETAL_SOLIDS = 'VEGETAL_SOLIDS',
  OTHER = 'OTHER'
}


