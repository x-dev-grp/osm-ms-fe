import { CustomerCategory } from './CustomerCategory';

export interface Customer {
  id?: string;
  matriculeFiscal: string;
  numCIN: string;
  customerName: string;
  customerLastName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address?: string;
  postalCode?: string;
  country?: string;
  category?: CustomerCategory;
  notes?: string;
  active?: boolean;
} 