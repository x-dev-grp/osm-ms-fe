export interface FactureItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  triturationPrice?: number;
}

export interface FacturePdfConfig {
  title: string;             // Titre ex: "Facture de réception"
  fileName: string;          // Nom du fichier PDF
  reference?: string;        // Numéro ou lot
  date?: string;             // Date facture
  supplierOrClient?: {       // Fournisseur ou client
    name: string;
    phone?: string;
    address?: string;
  };
  items: FactureItem[];      // Lignes de facture
  totals?: {
    subtotal: number;
    tva?: number;
    ttc?: number;
    paid?: number;
    remaining?: number;
  };
  footer?: string;           // Signature ou infos additionnelles
}

export interface Sale {
  id: number;
  product: string;
  quantity: number;
}
