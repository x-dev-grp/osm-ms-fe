import { Contract } from './contract.model';
import { Department } from './department.model';
import { PayRolls } from './payrolls.model';
import { Pointage } from './pointage.model';
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED'
}

export interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  hireDate: string;
  birthDate: string;
  cin: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  isActive: boolean;
  gender: Gender;
  maritalStatus: MaritalStatus;
  contrats?: Contract[];
  department?: Department;
  payRolls?: PayRolls[];
  pointages?: Pointage[];
}
