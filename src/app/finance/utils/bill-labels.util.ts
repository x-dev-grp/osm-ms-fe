import { TranslateService } from '@ngx-translate/core';
import { FinancialTransaction } from '../models/financial-transaction.model';

/** Same keys as list view / DELIVERIES.OPERATION_TYPE + TRANSACTIONS.TYPES */
export function resolveBillConditions(
  translate: TranslateService,
  transaction: Pick<FinancialTransaction, 'operationType' | 'transactionType'>
): string | undefined {
  if (transaction.operationType) {
    return translate.instant('DELIVERIES.OPERATION_TYPE.' + transaction.operationType);
  }
  if (transaction.transactionType) {
    return translate.instant('TRANSACTIONS.TYPES.' + transaction.transactionType);
  }
  return undefined;
}

export function resolveBillDesignation(
  translate: TranslateService,
  transaction: Pick<FinancialTransaction, 'description' | 'operationType' | 'transactionType'>
): string {
  if (transaction.description?.trim()) {
    return transaction.description.trim();
  }
  const fromType = resolveBillConditions(translate, transaction);
  if (fromType) {
    return fromType;
  }
  return translate.instant('TRANSACTIONS.BILL.DEFAULT_DESIGNATION');
}
