export interface WorkSchedule {
  id?: string;
  name: string;
  scheduleCode?: string;
  weeklyHours?: number;
  workingDays?: string;
  startTime?: string;
  endTime?: string;
  breakDurationMinutes?: number;
  nightShift?: boolean;
  rotatingShift?: boolean;
  active?: boolean;
}
