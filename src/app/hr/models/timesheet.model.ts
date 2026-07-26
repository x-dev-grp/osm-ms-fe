import { Employee } from './employee.model';
export interface Timesheet {
  id?: string;
  employee?: Employee;
  periodYear?: number;
  periodMonth?: number;
  status?: string;
  totalWorkedMinutes?: number;
  totalOvertimeMinutes?: number;
}
