import { Currency, PaymentMethod } from './financial-transaction.model';
import { SupplierType } from '../../shared/models/supplier-type';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';

export enum QualityGrades {
  VIRGIN = 'VIRGIN',
  EXTRA_VIRGIN = 'EXTRA_VIRGIN',
  LAMPANTE = 'LAMPANTE',
  OTHER = 'OTHER',
  REFINED = 'REFINED'
}

export interface OilSale {
  id?: string;
  supplier?: SupplierType;
  storageUnit: StorageUnitDto;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: Currency;
  paidAmount: number;
  unpaidAmount: number;
  paymentMethod: PaymentMethod;
  saleDate: string;
  qualityGrade: QualityGrades;
  invoiceNumber?: string;
  description?: string;
  status: OilSaleStatus;
  oilTransactionUUID?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  containerSales?: { id: string; count: number }[];
}

export enum OilSaleStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  DELIVERED = 'DELIVERED'
}


