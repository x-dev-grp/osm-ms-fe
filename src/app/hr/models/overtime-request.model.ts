import { Employee } from './employee.model';
export interface OvertimeRequest {
  id?: string;
  employee?: Employee;
  date?: string;
  minutes?: number;
  reason?: string;
  status?: string;
  multiplierApplied?: number;
  amount?: number;
}
