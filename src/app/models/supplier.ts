import {BaseType} from "./base-type";
import {SupplierType} from "./suppliertypedto";

export interface Supplier {
  id?: number;
  name: string;
  lastname: string;
  phone: string;
  email?: string;
  address: string;
   suppliertype?: SupplierType;
}


