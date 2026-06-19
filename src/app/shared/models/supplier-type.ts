import { BaseType } from './base-type';
import { SupplierInfo } from './supplier';
import { PartnerCategory } from '../../finance/models/PartnerCategory';

export interface SupplierType {
  id?: string;
  supplierInfo: SupplierInfo ;
  genericSupplierType:BaseType;
  hasStorage?:boolean
  name: string;
  lastname: string;
  phone: string;
  email: string; // Remove the '?' to make it required
  address: string;
  region: BaseType;
  matriculeFiscal: string;
  rib: string;
  bankName: string;
  fullName?: string;
}


