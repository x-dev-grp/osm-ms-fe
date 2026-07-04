import { DashboardConfig } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { TRANSACTIONS_DASHBOARD_CONFIG } from '../../../finance/transactions/transactions-dashboard.config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

/** Side payment ledger (ABIOOC suivi Fournisseur Base — montant / date columns). */
export function buildSupplierBasePaymentLedger(supplierId: string): DashboardConfig {
  const base = JSON.parse(JSON.stringify(TRANSACTIONS_DASHBOARD_CONFIG)) as DashboardConfig;
  base.addNewItem = false;
  base.titleTranslatePath = 'SUPPLIER.FINANCE.PAYMENT_LEDGER_TITLE';
  base.defaultSearchData = {
    page: 0,
    size: 15,
    sort: 'transactionDate',
    order: 'DESC',
    ...(base.defaultSearchData || {}),
    searchData: {
      ...(base.defaultSearchData?.searchData || {}),
      operation: SearchOperation.AND,
      search: {
        ...(base.defaultSearchData?.searchData?.search || {}),
        isDeleted: { equalValue: false },
        'supplier.id': { equalValue: supplierId }
      }
    }
  };
  return base;
}
