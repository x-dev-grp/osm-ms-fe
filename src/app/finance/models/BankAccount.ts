import { FinancialTransaction } from './financial-transaction.model';

export interface BankAccount {
  id?: string;
  rib: string;
  iban: string;
  bicSwift: string;
  bankName: string;
  bankBranch: string;
  currency: string;
  accountType: string;
  active: boolean;
  balance?: number;
  lastTransactionDate?: string;
  transactionCount?: number;
}

export interface BankAccountWithTransactions extends BankAccount {
  transactions?: FinancialTransaction[];
  totalInbound?: number;
  totalOutbound?: number;
  pendingTransactions?: number;
}
