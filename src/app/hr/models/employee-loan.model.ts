import { Employee } from './employee.model';
export interface EmployeeLoan {
  id?: string;
  employee?: Employee;
  principalAmount?: number;
  monthlyInstallment?: number;
  remainingBalance?: number;
  startDate?: string;
  status?: string;
}
