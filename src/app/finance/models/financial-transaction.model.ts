// ==================== ENUMS ====================

import { BankAccount } from './BankAccount';
import { Expense } from './expense.model';

export enum PaymentMethod {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  TRANSFER = 'TRANSFER',
  OIL = 'OIL',
  MIXED = 'MIXED',
  BOTH = 'MIXED'
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
  CHECK_PAYMENT = 'CHECK_PAYMENT',
  RECEPTION_IN = 'RECEPTION_IN',
  TRANSFER_IN = 'TRANSFER_IN',
  FILTRATION = 'FILTRATION',
  SALE = 'SALE',
  EXCHANGE = 'EXCHANGE',
  OIL_CONTAINER_SALE = 'OIL_CONTAINER_SALE',
  WASTE_SALE = 'WASTE_SALE',
  WASTE_PAYMENT = 'WASTE_PAYMENT',
  WASTE_DISPOSAL_COST = 'WASTE_DISPOSAL_COST',
  STORAGE_RENTAL = 'STORAGE_RENTAL'
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

export interface TransactionSupplier {
  id?: string;
  name?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  address?: string;
  matriculeFiscal?: string;
}

export interface FinancialTransaction {
  id?: string;
  transactionType?: TransactionType | string;
  direction?: TransactionDirection | string;
  amount: number | string;
  currency?: Currency | string;
  paymentMethod: PaymentMethod | string;
  bankAccount?: BankAccount;
  checkNumber?: string;
  externalTransactionId?: string;
  lotNumber?: string;
  supplier?: TransactionSupplier;
  supplierId?: TransactionSupplier;
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
  operationType?: string;
  resourceName?: string;
  vendorName?: string;
  paidAmount?: number;
  unpaidAmount?: number;
}

/** Normalizes API amounts that may arrive as number or string (BigDecimal). */
export function parseTransactionAmount(value: number | string | null | undefined): number {
  if (value == null || value === '') {
    return 0;
  }
  return typeof value === 'number' ? value : Number(value) || 0;
}

export interface BillParty {
  displayName: string;
  taxRegistrationNumber?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface BillBankInfo {
  bankName?: string;
  iban?: string;
  swiftCode?: string;
}

export interface BillLogistics {
  grossWeight?: string;
  netWeight?: string;
  packages?: string;
  incoterm?: string;
  deliveryAddress?: string;
}

export interface BillFooterContact {
  companyName?: string;
  name?: string;
  phone?: string;
}

export interface TransactionBillRequest {
  title?: string;
  conditions?: string;
  logoBase64?: string;
  logoContentType?: string;
  issuer: BillParty;
  clientOverride?: BillParty;
  designation?: string;
  vatRatePercent?: number;
  logistics?: BillLogistics;
  bankInfo?: BillBankInfo;
  paymentTerms?: string[];
  footerContact?: BillFooterContact;
  electronicInvoice?: boolean;
  ttnReference?: string;
  issuerElectronicSeal?: string;
  notes?: string;
}
