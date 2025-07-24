import { BaseType } from './base-type';
import { SupplierInfo } from './supplier';

export interface SupplierType {
  id?: string;
  supplierInfo: SupplierInfo ;
  genericSupplierType:BaseType;
  hasStorage?:boolean
}


