import { BaseType } from './base-type';
import { SupplierType } from './supplier-type';

export interface StorageUnitDto {
  id?: string;
  name: string;
  location: string;
  description?: string;

  maxCapacity: number;
  currentVolume: number;

  avgCost: number;
  totalCost: number;
  nextMaintenanceDate?: Date;
  lastInspectionDate?: Date;

  oilVariety?: BaseType;
  status: 'AVAILABLE' | 'FULL' | 'FILLING' | 'MAINTENANCE' | 'IN_USE' | 'CLEANING' | 'RESERVED' | 'OUT_OF_SERVICE';
  externalId:string;
  lastFillDate?: Date;
  lastEmptyDate?: Date;
  supplier: SupplierType;

  // Pricing information for storage unit rental
  monthlyRentalPrice?: number; // Price per month for renting this storage unit
  paidStorage?: boolean; // Indicates if this is a paid storage unit
}
