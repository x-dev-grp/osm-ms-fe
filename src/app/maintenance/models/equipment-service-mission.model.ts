import { MillEquipment } from './mill-equipment.model';

export type EquipmentServiceMissionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EquipmentServiceMission {
  id?: string;
  equipment: Pick<MillEquipment, 'id'> & Partial<MillEquipment>;
  clientName: string;
  clientPhone?: string;
  workLocation?: string;
  description?: string;
  operatorName?: string;
  status: EquipmentServiceMissionStatus;
  scheduledStart?: string | Date;
  scheduledEnd?: string | Date;
  completedAt?: string | Date;
  billableHours?: number;
  hourlyRate?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paidAmount?: number;
  unpaidAmount?: number;
  invoiceReference?: string;
  notes?: string;
  createdDate?: string | Date;
}
