import { BaseType } from './base-type';

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

  oilType?: BaseType;
  status: 'AVAILABLE' | 'FULL' | 'FILLING' | 'MAINTENANCE' | 'IN_USE' | 'CLEANING' | 'RESERVED' | 'OUT_OF_SERVICE';

  lastFillDate?: Date;
  lastEmptyDate?: Date;
}
