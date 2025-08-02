import { Customer } from './Customer';
import { Currency, PaymentMethod } from './financial-transaction.model';
import { SupplierType } from '../../shared/models/supplier-type';

export interface StorageUnit {
  id?: string;
  name: string;
  location: string;
  description?: string;
  maxCapacity: number;
  currentVolume: number;
  nextMaintenanceDate?: string;
  lastInspectionDate?: string;
  avgCost: number;
  totalCost: number;
  oilType?: {
    id?: string;
    name: string;
    description?: string;
  };
  status: StorageStatus;
  lastFillDate?: string;
  lastEmptyDate?: string;
  fillPercentage?: number;
}

export enum StorageStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
  FULL = 'FULL',
  EMPTY = 'EMPTY',
  RESERVED = 'RESERVED'
}

export interface OilSale {
  id?: string;
  customer?: Customer;
  supplier?: SupplierType;
  storageUnit: StorageUnit;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  saleDate: string;
  invoiceNumber?: string;
  description?: string;
  status: OilSaleStatus;
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

export interface UpdateOilSaleDto {
  id: string;
  customerId?: string;
  supplierId?: string;
  storageUnitId?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  saleDate?: string;
  invoiceNumber?: string;
  description?: string;
  status?: OilSaleStatus;
}

export interface OilSaleSearchDto {
  customerId?: string;
  supplierId?: string;
  storageUnitId?: string;
  status?: OilSaleStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  currency?: Currency;
}

export interface OilSaleStatistics {
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
  averageUnitPrice: number;
  currencyBreakdown: { [key in Currency]?: number };
  statusBreakdown: { [key in OilSaleStatus]?: number };
  customerBreakdown: { [customerId: string]: number };
  supplierBreakdown: { [supplierId: string]: number };
  storageUnitBreakdown: { [storageUnitId: string]: number };
  monthlyRevenue: { [month: string]: number };
  topCustomers: Array<{ customer: Customer; totalAmount: number; totalQuantity: number }>;
  topSuppliers: Array<{ supplier: SupplierType; totalAmount: number; totalQuantity: number }>;
  topStorageUnits: Array<{ storageUnit: StorageUnit; totalAmount: number; totalQuantity: number }>;
}
