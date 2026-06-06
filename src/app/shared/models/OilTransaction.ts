import { StorageUnitDto } from './StorageUnitDto';
import { UnifiedDelivery } from './UnifiedDelivery';

// Transaction Type enum matching backend
export enum TransactionType {
  RECEPTION_IN = 'RECEPTION_IN',
  TRANSFER_IN = 'TRANSFER_IN',
  LOAN = 'LOAN',
  SALE = 'SALE',
  "OIL_SALE" = 'OIL_SALE',

EXCHANGE = 'EXCHANGE'
}

// Transaction State enum matching backend
export enum TransactionState {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface OilTransaction {
  /** UUID of this transaction */
  id: string;

  /** Transaction type enum */
  transactionType: TransactionType;

  /** Transaction state enum */
  transactionState: TransactionState;

  /** The tank/cistern receiving oil */
  storageUnitDestination: StorageUnitDto;

  /** The tank/cistern supplying oil (optional for some transaction types) */
  storageUnitSource?: StorageUnitDto;

  /** Grade or result of quality control */
  qualityGrade: string;

  /** Net quantity moved, in kilograms (positive for IN, negative for OUT) */
  quantityKg: number;

  /** Price per kilogram */
  unitPrice: number;

  /** Calculated total (unitPrice * quantityKg + container costs) */
  totalPrice: number;

  /** Reference to the associated oil sale (optional) */
  oilSaleId?: string;

  /** Reference to the reception lot (optional) */
  reception?: UnifiedDelivery;

  /** List of containers used in the transaction */
  containers?: { id: string; count: number }[];

  /** Audit fields (from BaseEntity) */
  createdDate?: string;
  lastModifiedDate?: string;
}
