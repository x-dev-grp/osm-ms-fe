import { PayslipStatus } from './hr.enums';
import { Employee } from './employee.model';
import { PayrollPeriod } from './payroll-period.model';

export interface Payslip {
  id?: string;
  payrollPeriod?: PayrollPeriod;
  employee?: Employee;
  grossSalary?: number;
  baseSalary?: number;
  bonuses?: number;
  cnssEmployee?: number;
  cnssEmployer?: number;
  irpp?: number;
  css?: number;
  netSalary?: number;
  paid?: boolean;
  paymentDate?: string;
  status?: PayslipStatus;
}
