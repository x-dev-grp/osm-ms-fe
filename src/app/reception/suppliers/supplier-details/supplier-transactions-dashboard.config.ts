import { DashboardConfig } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { TRANSACTIONS_DASHBOARD_CONFIG } from '../../../finance/transactions/transactions-dashboard.config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export function buildSupplierTransactionsDashboard(supplierId: string): DashboardConfig {
  const base = JSON.parse(JSON.stringify(TRANSACTIONS_DASHBOARD_CONFIG)) as DashboardConfig;
  base.addNewItem = false;
  base.titleTranslatePath = 'SUPPLIER.FINANCE.TRANSACTIONS_TITLE';
  base.defaultSearchData = {
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
