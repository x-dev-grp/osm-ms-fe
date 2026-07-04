import { LeaveStatus, LeaveType } from './hr.enums';
import { Employee } from './employee.model';

export interface LeaveRequest {
  id?: string;
  employee?: Employee;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays?: number;
  status?: LeaveStatus;
}
