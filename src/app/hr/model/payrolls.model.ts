import { Employee } from './employee-model';

export interface PayRolls {
  id?: number;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  bonuses: number;
  deduction: number;
  netSalary: number;
  paid: boolean;
  paymentDate: string;
  employee: Employee;
}
