import { Poste } from './poste.model';

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED'
}

export enum ContractType {
  INTERNSHIP = 'INTERNSHIP',
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'STAGE',
  TEMPORARY = 'TEMPORARY'
}

export interface Contract {
  id?: string;
  startDate: string; // LocalDate → string (ISO)
  endDate: string;
  salary: number;
  poste?: Poste;
  contractType: ContractType;
  contractStatus: ContractStatus;
  externalId: string;
}
