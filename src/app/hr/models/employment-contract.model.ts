import { ContractStatus, ContractType } from './hr.enums';
import { Employee } from './employee.model';
import { Poste } from './poste.model';

export interface EmploymentContract {
  id?: string;
  employee?: Employee;
  poste?: Poste;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  salary?: number;
  status?: ContractStatus;
}
