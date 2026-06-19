import { Currency, PaymentMethod } from './financial-transaction.model';
import { SupplierType } from '../../shared/models/supplier-type';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';

export { QualityGrades } from '../../shared/models/quality-grades.enum';
import { QualityGrades } from '../../shared/models/quality-grades.enum';

export interface OilSale {
  id?: string;
  supplier?: SupplierType;
  storageUnit?: StorageUnitDto;
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
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  paid?: boolean;
  status: OilSaleStatus;
  oilTransactionUUID?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  containerSales?: OilContainerSaleLine[];
}

export interface OilContainerSaleLine {
  id?: string;
  containerId?: string;
  containerName?: string;
  capacityInLiters?: number;
  count: number;
  unitPrice?: number;
  lineTotal?: number;
}

export enum OilSaleStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  DELIVERED = 'DELIVERED'
}


