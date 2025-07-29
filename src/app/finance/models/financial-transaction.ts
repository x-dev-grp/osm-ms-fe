export enum PaymentMethod {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  TRANSFER = 'TRANSFER',
  oil='oil',
  both='both',
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
