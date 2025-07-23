export enum PaymentMethod {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  TRANSFER = 'TRANSFER'
}

export enum TransactionStatus {
  VALIDATED = 'VALIDATED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export interface FinancialTransaction {
  id?: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  date: string; // ISO string
  status: TransactionStatus;
  reference?: string;
  createdBy?: string;
  createdAt?: string;
  relatedEntityId?: number;
}
