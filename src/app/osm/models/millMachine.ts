// mill-machine.model.ts
export interface MillMachine {
  id?: string;
  name: string;
  machineType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  capacity?: number;
  operatingStatus?: string;
  hoursOperated?: number;
  lastMaintenanceDate?: Date;  // or string
  nextMaintenanceDate?: Date;  // or string
  description?: string;
}
