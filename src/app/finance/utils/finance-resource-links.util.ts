import { FinancialTransaction } from '../models/financial-transaction.model';

export type FinanceResourceKind = 'delivery' | 'oil_sale' | 'waste_sale' | 'expense' | 'supplier' | 'equipment_mission';

export interface FinanceResourceLink {
  kind: FinanceResourceKind;
  labelKey: string;
  hintKey?: string;
  route: string[];
  queryParams?: Record<string, string>;
  displayText: string;
}

function normalizeResourceName(value?: string | null): string {
  return (value ?? '').trim().toUpperCase();
}

function supplierIdFrom(tx: FinancialTransaction): string | undefined {
  const nested = tx.supplier?.id;
  if (nested) {
    return nested;
  }
  const legacy = tx.supplierId;
  if (legacy && typeof legacy === 'object' && legacy.id) {
    return legacy.id;
  }
  return undefined;
}

function isWasteTransaction(tx: FinancialTransaction): boolean {
  const type = (tx.transactionType ?? '').toUpperCase();
  const op = (tx.operationType ?? '').toUpperCase();
  return normalizeResourceName(tx.resourceName) === 'WASTE' || type.includes('WASTE') || op.includes('WASTE');
}

function isOilSaleTransaction(tx: FinancialTransaction): boolean {
  const resource = normalizeResourceName(tx.resourceName);
  const type = (tx.transactionType ?? '').toUpperCase();
  const op = (tx.operationType ?? '').toUpperCase();
  return resource === 'OILSALE' || type === 'OIL_SALE' || op === 'OIL_SALE';
}

function isExpenseTransaction(tx: FinancialTransaction): boolean {
  const resource = normalizeResourceName(tx.resourceName);
  const type = (tx.transactionType ?? '').toUpperCase();
  return !!tx.expense?.id || resource === 'EXPENSE' || type === 'EXPENSE';
}

function isEquipmentServiceTransaction(tx: FinancialTransaction): boolean {
  const resource = normalizeResourceName(tx.resourceName);
  const type = (tx.transactionType ?? '').toUpperCase();
  return resource === 'EQUIPMENTSERVICEMISSION' || type === 'EQUIPMENT_SERVICE';
}

function isDeliveryTransaction(tx: FinancialTransaction): boolean {
  const resource = normalizeResourceName(tx.resourceName);
  return resource === 'UNIFIEDDELIVERY' || (!resource && !!tx.lotNumber && !isWasteTransaction(tx) && !isOilSaleTransaction(tx));
}

export function resolveFinanceResourceLinks(tx?: FinancialTransaction | null): FinanceResourceLink[] {
  if (!tx) {
    return [];
  }

  const links: FinanceResourceLink[] = [];
  const externalId = tx.externalTransactionId?.trim();
  const displayFallback = tx.invoiceReference || tx.lotNumber || externalId || '—';

  if (isOilSaleTransaction(tx) && externalId) {
    links.push({
      kind: 'oil_sale',
      labelKey: 'TRANSACTIONS.FIELDS.OIL_SALE_LINK',
      hintKey: 'TRANSACTIONS.FIELDS.LINKED_OIL_SALE_HINT',
      route: ['/finance/oil-sales', externalId, 'view'],
      displayText: tx.invoiceReference || externalId
    });
  }

  if (isEquipmentServiceTransaction(tx) && externalId) {
    links.push({
      kind: 'equipment_mission',
      labelKey: 'TRANSACTIONS.LINKS.EQUIPMENT_MISSION',
      hintKey: 'TRANSACTIONS.LINKS.EQUIPMENT_MISSION_HINT',
      route: ['/equipment-missions', externalId, 'view'],
      displayText: tx.invoiceReference || externalId
    });
  }

  if (isWasteTransaction(tx) && externalId) {
    links.push({
      kind: 'waste_sale',
      labelKey: 'TRANSACTIONS.LINKS.WASTE_SALE',
      hintKey: 'TRANSACTIONS.LINKS.WASTE_SALE_HINT',
      route: ['/finance/waste-sales', externalId, 'view'],
      displayText: tx.invoiceReference || externalId
    });
  } else if (isDeliveryTransaction(tx) && externalId) {
    links.push({
      kind: 'delivery',
      labelKey: 'TRANSACTIONS.LINKS.DELIVERY',
      hintKey: 'TRANSACTIONS.LINKS.DELIVERY_HINT',
      route: ['/reception/reception-details', externalId],
      displayText: tx.lotNumber || displayFallback
    });
  }

  const expenseId = tx.expense?.id || (isExpenseTransaction(tx) && externalId ? externalId : undefined);
  if (expenseId) {
    links.push({
      kind: 'expense',
      labelKey: 'TRANSACTIONS.LINKS.EXPENSE',
      hintKey: 'TRANSACTIONS.LINKS.EXPENSE_HINT',
      route: ['/finance/expenses', expenseId, 'view'],
      displayText: tx.invoiceReference || tx.description || expenseId
    });
  }

  const supplierId = supplierIdFrom(tx);
  if (supplierId) {
    const supplierLabel = [tx.supplier?.name, tx.supplier?.lastname].filter(Boolean).join(' ').trim();
    links.push({
      kind: 'supplier',
      labelKey: 'TRANSACTIONS.LINKS.SUPPLIER',
      hintKey: 'TRANSACTIONS.LINKS.SUPPLIER_HINT',
      route: ['/reception/fournisseur/details', supplierId],
      queryParams: { tab: 'finance' },
      displayText: supplierLabel || supplierId
    });
  }

  return links;
}

export function buildTransactionsQueryParams(input: {
  externalTransactionId?: string | null;
  lotNumber?: string | null;
}): Record<string, string> | undefined {
  const queryParams: Record<string, string> = {};
  if (input.externalTransactionId) {
    queryParams['externalTransactionId'] = input.externalTransactionId;
  } else if (input.lotNumber) {
    queryParams['lotNumber'] = input.lotNumber;
  }
  return Object.keys(queryParams).length ? queryParams : undefined;
}
