import { SupplierInfo } from '../../osm/models/supplier';
import { BaseType } from './BaseType';

export interface SupplierType {
  id?: string;
  supplierInfo: SupplierInfo;
  genericSupplierType: BaseType;
}
