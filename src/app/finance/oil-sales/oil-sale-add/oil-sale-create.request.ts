import { Currency, PaymentMethod } from '../../models/financial-transaction.model';
import { QualityGrades } from '../../models/oil-sale.model';

export interface ContainerSaleLine {
  id: string;      // OilContainer id
  count: number;   // units to sell
}

/**
 * Front-end create payload that the backend expects.
 * - We send IDs (supplier, storageUnit).
 * - Totals are computed on the server.
 * - containerSales is optional; omit or send [] for "no containers".
 */
export interface OilSaleCreateRequest {
  supplier?: string;               // supplier id (optional)
  storageUnit: string;             // storage unit id (required)

  quantity: number;                // oil quantity
  unitPrice: number;               // oil unit price

  currency: Currency;              // e.g. 'TND'
  paymentMethod: PaymentMethod;    // e.g. 'CASH'

  saleDate: string;                // LocalDateTime string (see helper below)
  qualityGrade: QualityGrades;     // VIRGIN | EXTRA_VIRGIN | ...

  invoiceNumber?: string;
  description?: string;

  paidAmount?: number;             // optional; default 0 if omitted

  // optional lines for containers
  containerSales?: ContainerSaleLine[];
}
