import { Employee } from './employee.model';
export interface PayrollVariable {
  id?: string;
  employee?: Employee;
  year?: number;
  month?: number;
  type?: string;
  amount?: number;
  quantity?: number;
  reason?: string;
  status?: string;
}
