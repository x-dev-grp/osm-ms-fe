import { EmployeeStatus, PaymentMode, SalaryType, WorkRegime } from './hr.enums';
import { EmploymentContract } from './employment-contract.model';
import { LeaveRequest } from './leave-request.model';
import { Payslip } from './payslip.model';
import { Pointage } from './pointage.model';

export interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  cin?: string;
  cnssMatricule?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  hireDate?: string;
  terminationDate?: string;
  jobTitle?: string;
  department?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  numberOfChildren?: number;
  taxIdentifier?: string;
  rib?: string;
  status?: EmployeeStatus;
  salaryType?: SalaryType;
  paymentMode?: PaymentMode;
  bankAccountRef?: string;
  workRegime?: WorkRegime;
  contracts?: EmploymentContract[];
  activeContract?: EmploymentContract;
  pointages?: Pointage[];
  leaveRequests?: LeaveRequest[];
  payslips?: Payslip[];
}
