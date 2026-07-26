import { ContractStatus, ContractType } from './hr.enums';
import { Employee } from './employee.model';
import { Poste } from './poste.model';

export type CddLegalReason =
  | 'TEMPORARY_REPLACEMENT'
  | 'SEASONAL_WORK'
  | 'TEMPORARY_INCREASE_ACTIVITY'
  | 'TEMPORARY_NATURE_OF_WORK'
  | 'OTHER_LEGAL_EXCEPTION';

export interface EmploymentContract {
  id?: string;
  employee?: Employee;
  poste?: Poste;
  contractNumber?: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  salary?: number;
  baseSalary?: number;
  cddLegalReason?: CddLegalReason;
  cddReasonDetails?: string;
  probationStart?: string;
  probationEnd?: string;
  weeklyHours?: number;
  status?: ContractStatus;
}
