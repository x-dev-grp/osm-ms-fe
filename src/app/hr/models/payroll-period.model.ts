import { PayrollPeriodStatus } from './hr.enums';
import { Payslip } from './payslip.model';

export interface PayrollPeriod {
  id?: string;
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  status?: PayrollPeriodStatus;
  payslips?: Payslip[];
}
