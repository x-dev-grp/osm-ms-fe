import { QCControlPoint } from './QCControlPoint.model';

export interface QCPlan {
  id?: string;
  ofId: string;
  titre: string;
  actif: boolean;
  points?: QCControlPoint[];
  createdDate?: string;
}
