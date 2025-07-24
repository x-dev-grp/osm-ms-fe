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
  status: TransactionStatus;
  reference?: string;

  relatedEntityId?: number;
}
