import { PaymentMethod } from './financial-transaction';

export interface Expense {
  id?: string;
  invoiceRef?: string;       // facture or null
  purchaseNature?: string;   // nature d'achat
  amount: number;            // somme or montant
  object?: string;           // objet for non-invoiced
  vendor?: string;             // Vendor or supplier
  category?: string;           // Expense category
  paymentMethod?: PaymentMethod;      // Cash, Cheque, Transfer, etc.
  status?: 'Pending' | 'Paid' | 'Reimbursed'; // Expense status
  notes?: string;              // Additional notes or comments
  receiptNumber?: string;      // Receipt number (not file)
  createdBy?: string;          // User who created the expense
  approved?: boolean;          // Approval status
  approvalDate?: Date;         // When approved
}
