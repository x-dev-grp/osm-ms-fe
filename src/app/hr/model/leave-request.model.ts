export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER'
}

export interface LeaveRequest {
  id?: number;
  startDate: string;
  endDate: string;
  reason: string;
  duration_days: number;
  status: LeaveStatus;
  leaveType: LeaveType;
}
