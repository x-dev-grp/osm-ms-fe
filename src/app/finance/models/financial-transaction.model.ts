// ==================== ENUMS ====================

import { BankAccount } from './BankAccount';
import { Expense } from './expense.model';
import { SupplierType } from '../../shared/models/supplier-type';
  export enum PaymentMethod {
  CASH = 'cash',
  CHEQUE = 'CHEQUE',
  TRANSFER = 'TRANSFER',
  OIL='oil',
  BOTH='both',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  EXPENSE = 'EXPENSE',
  PURCHASE = 'PURCHASE',
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  LOAN = 'LOAN',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  OIL_SALE = 'OIL_SALE',
  OIL_PURCHASE = 'OIL_PURCHASE',
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
  SUPPLIER_CREDIT = 'SUPPLIER_CREDIT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  CHECK_DEPOSIT = 'CHECK_DEPOSIT',
  CHECK_PAYMENT = 'CHECK_PAYMENT'
}

export enum TransactionDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  INTERNAL = 'INTERNAL'
}

export enum Currency {
  TND = 'TND',
  EUR = 'EUR',
  USD = 'USD'
}

// ==================== INTERFACES ====================

export interface FinancialTransaction {
  id?: string;
  transactionType?: TransactionType;
  direction?: TransactionDirection;
  amount: number;
  currency?: Currency;
  paymentMethod: PaymentMethod;
  bankAccount?: BankAccount;
  checkNumber?: string;
  externalTransactionId?: string;
  lotNumber?: string;
  supplierId?: SupplierType;
   expense?: Expense;
  description?: string;
  invoiceReference?: string;
  receiptReference?: string;
  transactionDate: string;
  approved?: boolean;
  approvalDate?: string;
  approvedBy?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}
