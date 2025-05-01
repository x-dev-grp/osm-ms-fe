import { BaseType } from './base-type';
export interface SupplierInfo {
  id?: string;
  name: string;
  lastname: string;
  phone: string;
  email: string; // Remove the '?' to make it required
  address: string;
  region: BaseType;
  rib: string;
  bankName: string;
}


