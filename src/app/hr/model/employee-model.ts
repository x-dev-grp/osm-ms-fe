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
  id?: number;
  firstName: string;
  lastName: string;
  hire_date: string;
  birthDate: string;
  cin: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  is_active: boolean;
  gender: Gender;
  maritalStatus: MaritalStatus;
  contrats?: Contract[];
  department?: Department;
  payrolls?: PayRolls[];
  pointages?: Pointage[];
}
