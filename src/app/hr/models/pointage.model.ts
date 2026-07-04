import { AttendanceStatus } from './hr.enums';
import { Employee } from './employee.model';

export interface Pointage {
  id?: string;
  employee?: Employee;
  workDate: string;
  checkIn?: string;
  checkOut?: string;
  workedHours?: number;
  breakMinutes?: number;
  status?: AttendanceStatus;
  notes?: string;
}
