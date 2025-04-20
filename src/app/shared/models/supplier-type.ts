import { SupplierInfo } from './supplierInfo';
import { BaseType } from './base-type';

export interface SupplierType {
  id?: string;
  supplierInfo: SupplierInfo;
  genericSupplierType: BaseType;
}
