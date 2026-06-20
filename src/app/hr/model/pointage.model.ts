export enum PointageStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  ON_LEAVE = 'ON_LEAVE'
}
export interface Pointage {
  id?: number;
  date: string; // LocalDate
  checkIn: string; // LocalTime
  checkOut: string;
  pointageDuree?: string; // Time
  status: PointageStatus;
}
