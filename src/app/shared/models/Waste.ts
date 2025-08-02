
import { Customer } from '../../finance/models/Customer';
import { SupplierType } from './supplier-type';

   export enum WasteType {
  POMACE         = 'POMACE',
  VEGETAL_WATER  = 'VEGETAL_WATER',
  VEGETAL_SOLIDS = 'VEGETAL_SOLIDS',
  OTHER          = 'OTHER'

}

export interface Waste {
  /** from BaseEntity */
  id?: string;                // UUID

  /** the kind of waste */
  type: WasteType;

  /** weight in kilograms */
  quantityInKg: number;

  /** price per kilogram */
  unitPrice: number;

  /** computed by backend: quantityInKg × unitPrice */
  totalPrice?: number;

  /** when it was sold/shipped */
  saleDate?: string;          // ISO timestamp

  /** your invoice reference */
  invoiceNumber?: string;

  /** has the client paid? */
  paid?: boolean;

  /** when payment cleared */
  paymentDate?: string;       // ISO timestamp

  /** where in your warehouse it’s stored */
  storageLocationCode?: string;

  /** customer’s UUID */
  customer: Customer;

  /** supplier details (nested object) */
  supplier?: SupplierType;

  /** free-form notes */
  notes?: string;

  /** audit (from BaseEntity) */
  createdDate?: string;       // ISO timestamp
  createdBy?: string;
  updatedDate?: string;       // ISO timestamp
  updatedBy?: string;
}
