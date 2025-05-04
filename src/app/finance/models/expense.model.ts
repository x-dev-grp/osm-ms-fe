export interface Expense {
  id?: string;
  invoiceRef?: string;       // facture or null
  purchaseNature?: string;   // nature d'achat
  amount: number;            // somme or montant
  date?: Date;               // for non-invoiced
  object?: string;           // objet for non-invoiced
}
