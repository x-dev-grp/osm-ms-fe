import { SupplierType } from '../../shared/models/supplier-type';
import { Currency, PaymentMethod } from './financial-transaction.model';

export interface WasteSale {
  id?: string; // optionnel si c’est une entité persistée
  type: WasteType;
  quantityInKg: number;
  unitPrice: number;
  totalPrice: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentMethod: PaymentMethod;
  currency: Currency;
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
