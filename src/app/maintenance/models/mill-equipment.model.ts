export type MillEquipmentType = 'TRACTOR' | 'TRAILER' | 'PUMP' | 'HARVESTER' | 'OTHER';

export type MillEquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface MillEquipment {
  id?: string;
  code?: string;
  name: string;
  equipmentType: MillEquipmentType;
  registrationNumber?: string;
  defaultHourlyRate?: number;
  status?: MillEquipmentStatus;
  hoursOperated?: number;
  lastMaintenanceDate?: string | Date;
  nextMaintenanceDate?: string | Date;
  notes?: string;
  createdDate?: string | Date;
}
