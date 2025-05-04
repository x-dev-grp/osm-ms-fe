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
}
