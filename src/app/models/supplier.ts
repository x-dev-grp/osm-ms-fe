import {BaseType} from "./generic/base-type";
import {suppliertype} from "./generic/SupplierTypeDto";

export interface Supplier {
  id?: number;
  name: string;
  lastname: string;
  phone: string;
  email?: string;
  address: string;
  suppliertype?: suppliertype;
}


