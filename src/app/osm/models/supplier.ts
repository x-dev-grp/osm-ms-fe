import { BaseType } from './base-type';

export interface Supplier {
  id?: string;
  name: string;
  lastname: string;
  phone: string;
  email?: string;
  address: string;
  region:string;
  rib:string;
  bankName:string;
  suppliertype:BaseType;
}


