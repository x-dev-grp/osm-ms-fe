import { Customer } from './Customer';
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
  customer?: Customer;
  supplier?: SupplierType;
  storageUnit: StorageUnitDto;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: Currency;
  paiedAmount: number;
  unpaiedAmount: number;
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
}

export enum OilSaleStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  DELIVERED = 'DELIVERED'
}

export interface CreateOilSaleDto {
  customerId?: string;
  supplierId?: string;
  storageUnitId: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  saleDate: string;
  statue: string;
  invoiceNumber?: string;
  description?: string;
}
