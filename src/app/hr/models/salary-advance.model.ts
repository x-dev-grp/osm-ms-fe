import { Employee } from './employee.model';
export interface SalaryAdvance {
  id?: string;
  employee?: Employee;
  amount?: number;
  requestDate?: string;
  paymentDate?: string;
  deductionPeriodYear?: number;
  deductionPeriodMonth?: number;
  remainingAmount?: number;
  reason?: string;
  status?: string;
}
