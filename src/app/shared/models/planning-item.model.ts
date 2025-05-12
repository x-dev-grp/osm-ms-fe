// src/app/shared/models/planning-item.model.ts
export interface PlanningItem {
  id: string;
  lotNumber: string;
  deliveryDate: Date;
  millMachineId?: string;
  deliveryNumber?: string;
  oliveQuantity: number; // Required, in kilograms
  globalLotNumber?: string;
}
