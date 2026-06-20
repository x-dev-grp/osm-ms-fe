export type MaintenanceAssetType = 'MILL_MACHINE' | 'STORAGE_UNIT' | 'LIGNE_CONDITIONNEMENT';

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';

export type MaintenanceWorkOrderStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MaintenanceWorkOrder {
  id?: string;
  assetType: MaintenanceAssetType;
  assetId: string;
  assetName?: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceWorkOrderStatus;
  scheduledStart?: string | Date;
  scheduledEnd?: string | Date;
  completedAt?: string | Date;
  technician?: string;
  vendor?: string;
  description?: string;
  partsReplaced?: string;
  partsCost?: number;
  laborCost?: number;
  totalCost?: number;
  paymentMethod?: string;
  notes?: string;
  invoiceReference?: string;
  createdDate?: string | Date;
}

export interface MaintenanceAssetOption {
  id: string;
  label: string;
}
