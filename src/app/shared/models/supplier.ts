import { BaseType } from './base-type';
import { PartnerCategory } from '../../finance/models/PartnerCategory';
export interface SupplierInfo {
  id?: string;
  name: string;
  lastname: string;
  phone: string;
  email: string; // Remove the '?' to make it required
  address: string;
  region: BaseType;
  category?: PartnerCategory;
  matriculeFiscal: string;
  rib: string;
  bankName: string;
}


