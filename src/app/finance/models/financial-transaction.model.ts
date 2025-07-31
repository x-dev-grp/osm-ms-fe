// ==================== ENUMS ====================

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

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OIL_CREDIT = 'OIL_CREDIT'
}

export enum CustomerCategory {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS'
}

// ==================== INTERFACES ====================

export interface BankAccount {
  id?: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  currency: Currency;
  balance?: number;
  customer?: Customer;
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface Customer {
  id?: string;
  matriculeFiscal: string;
  numCIN: string;
  customerName: string;
  customerLastName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address?: string;
  postalCode?: string;
  country?: string;
  category?: CustomerCategory;
  notes?: string;
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface Supplier {
  id?: string;
  supplierInfo?: any;
  genericSupplierType?: any;
  hasStorage?: boolean;
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface Expense {
  id?: string;
  invoiceRef?: string;
  purchaseNature?: string;
  object?: string;
  date?: string;
  amount?: number;
  vendor?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  status?: string;
  notes?: string;
  receiptNumber?: string;
  approved?: boolean;
  approvalDate?: string;
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface FinancialTransaction {
  id?: string;
  transactionType: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency?: Currency;
  paymentMethod: PaymentMethod;
  bankAccount?: BankAccount;
  checkNumber?: string;
  externalTransactionId?: string;
  lotNumber?: string;
  supplierId?: Supplier;
  customer?: Customer;
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

// ==================== DTOs ====================

export interface CreateFinancialTransactionDto {
  transactionType: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency?: Currency;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  checkNumber?: string;
  externalTransactionId?: string;
  lotNumber?: string;
  supplierId?: string;
  customerId?: string;
  expenseId?: string;
  description?: string;
  invoiceReference?: string;
  receiptReference?: string;
  transactionDate: string;
}

export interface UpdateFinancialTransactionDto {
  id: string;
  transactionType?: TransactionType;
  direction?: TransactionDirection;
  amount?: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  checkNumber?: string;
  externalTransactionId?: string;
  lotNumber?: string;
  supplierId?: string;
  customerId?: string;
  expenseId?: string;
  description?: string;
  invoiceReference?: string;
  receiptReference?: string;
  transactionDate?: string;
  approved?: boolean;
  approvedBy?: string;
}

export interface FinancialTransactionSearchDto {
  transactionType?: TransactionType;
  direction?: TransactionDirection;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  supplierId?: string;
  customerId?: string;
  approved?: boolean;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  lotNumber?: string;
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
}

export interface FinancialTransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalInbound: number;
  totalOutbound: number;
  totalInternal: number;
  currencyBreakdown: { [key in Currency]?: number };
  typeBreakdown: { [key in TransactionType]?: number };
  directionBreakdown: { [key in TransactionDirection]?: number };
} 