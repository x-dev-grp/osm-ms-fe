// Interfaces
import { MillMachine } from './millMachine';

export interface BoardItem {
  type: PlanItemType;
  data: PlanningItem | GlobalLot;
}

export interface PlanningItem {
  completed?: boolean; // tracks completion status
  id: string;
  lotNumber: string;
  deliveryDate: Date;
  millMachineId?: string;
  deliveryNumber?: string;
  oliveQuantity: number; // original olive weight
  globalLotNumber?: string | null | undefined;
  supplier?: string;
  region?: string;
  oliveVariety?: string;
  oliveType?: string;
  operationType?: string;
  poidsBrute?: number;
  poidsNet?: number;
  sackCount?: number | null | undefined;

  // ← NEW FIELDS BEGIN ↓
  oilQuantity?: number | null; // how much oil (kg) was produced
  rendement?: number | null; // yield percentage
  completionDate?: Date; // when the lot was completed
  finalObservation?: string; // any final comment
  // ← NEW FIELDS END ↑
}

export interface GlobalLot {
  id?: string;
  globalLotNumber: string;
  millMachineId?: string;
  totalKg: number; // total olive weight
  childLotNumbers: string[];
  receptionIds: string[];
  items: BoardItem[];
  completed?: boolean; // track completion

  // ← NEW FIELDS BEGIN ↓
  oilQuantity?: number | null; // aggregated oil across child lots
  rendement?: number | null; // aggregated yield %
  completionDate?: Date; // when this global lot was completed
  finalObservation?: string; // final comment/note
  // ← NEW FIELDS END ↑
}

export interface GlobalLotGroup {
  globalLotNumber: string | null;
  items: BoardItem[];
}

export enum PlanItemType {
  LOT = 'LOT',
  GLOBAL_LOT = 'GLOBAL_LOT'
}

export interface PlanItemDTO {
  type: PlanItemType;
  id: string;
  lot?: LotDTO;
}

export interface MillPlanDTO {
  millMachineId: string;
  items: PlanItemDTO[];
}

export interface LotDTO {
  rendement: number | null;
  oilQuantity: number | null;
  lotNumber: string;
  oliveQuantity: number;
  deliveryDate: string;
  millMachineId?: string;
  globalLotNumber?: string | null;
  completed?: boolean; // Added to track completion status
}

export interface GlobalLotDTO {
  globalLotNumber: string;
  totalKg: number;
  lots: LotDTO[];
  completed?: boolean; // Added to track completion status
}

export interface PlanningSaveRequest {
  mills: MillPlanDTO[];
  globalLots: GlobalLotDTO[];
}

export type Mill = MillMachine & { receptions: BoardItem[] };
