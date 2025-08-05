import {SupplierInfo} from '../../shared/models/supplier';

export interface Waste {
  id?: string; // optionnel si c’est une entité persistée
  type: WasteType;
  quantityInKg: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: Date;
  invoiceNumber: string;
  paid: boolean;
  paymentDate?: Date;
  storageLocationCode: string;
  customer: string; // UUID sous forme de string
  supplier: SupplierInfo;
  notes?: string;
}

export enum WasteType {
  MARGINE = 'MARGINE',
  POMACE = 'POMACE',
  VEGETAL_SOLIDS = 'VEGETAL_SOLIDS',
  OTHER = 'OTHER'
}


