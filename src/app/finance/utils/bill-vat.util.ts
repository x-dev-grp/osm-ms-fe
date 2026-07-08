import { FinancialTransaction, TransactionType } from '../../finance/models/financial-transaction.model';

const SALE_OPERATION_TYPES = new Set([
  'OIL_SALE',
  'WASTE_SALE',
  'OIL_CONTAINER_SALE',
  'OIL_SALE_PAYMENT',
  'STORAGE_RENTAL'
]);

const PURCHASE_OPERATION_TYPES = new Set(['OIL_PURCHASE', 'OLIVE_PURCHASE']);

const SALE_TRANSACTION_TYPES = new Set([
  TransactionType.OIL_SALE,
  TransactionType.WASTE_SALE,
  TransactionType.OIL_CONTAINER_SALE,
  TransactionType.SALE,
  TransactionType.STORAGE_RENTAL,
  TransactionType.WASTE_PAYMENT
]);

const PURCHASE_TRANSACTION_TYPES = new Set([
  TransactionType.OIL_PURCHASE,
  TransactionType.PURCHASE,
  TransactionType.EXPENSE,
  TransactionType.SUPPLIER_PAYMENT,
  TransactionType.SUPPLIER_CREDIT
]);

export function isSaleBillTransaction(
  transaction: Pick<FinancialTransaction, 'operationType' | 'transactionType' | 'resourceName'>
): boolean {
  if (transaction.resourceName === 'OILSALE') {
    return true;
  }
  if (transaction.operationType) {
    if (SALE_OPERATION_TYPES.has(String(transaction.operationType))) {
      return true;
    }
    if (PURCHASE_OPERATION_TYPES.has(String(transaction.operationType))) {
      return false;
    }
  }
  if (transaction.transactionType) {
    const type = String(transaction.transactionType) as TransactionType;
    if (SALE_TRANSACTION_TYPES.has(type)) {
      return true;
    }
    if (PURCHASE_TRANSACTION_TYPES.has(type)) {
      return false;
    }
  }
  return false;
}

export function isPurchaseBillTransaction(
  transaction: Pick<FinancialTransaction, 'operationType' | 'transactionType' | 'resourceName'>
): boolean {
  if (transaction.resourceName === 'OILSALE') {
    return false;
  }
  if (transaction.operationType && PURCHASE_OPERATION_TYPES.has(String(transaction.operationType))) {
    return true;
  }
  if (transaction.transactionType) {
    return PURCHASE_TRANSACTION_TYPES.has(String(transaction.transactionType) as TransactionType);
  }
  return false;
}
