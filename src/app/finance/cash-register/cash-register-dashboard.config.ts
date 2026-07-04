import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { TRANSACTIONS_DASHBOARD_CONFIG } from '../transactions/transactions-dashboard.config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

/** ABIOOC `Caisse Abiooc.xlsx` — cash movements (entrée / sortie). */
export const CASH_REGISTER_DASHBOARD: DashboardConfig = {
  ...(JSON.parse(JSON.stringify(TRANSACTIONS_DASHBOARD_CONFIG)) as DashboardConfig),
  icon: 'point_of_sale',
  addNewItem: true,
  addNewItemUrl: '/finance/transactions/new',
  titleTranslatePath: 'ABIOOC.CASH_REGISTER.TITLE',
  defaultSearchData: {
    page: 0,
    size: 50,
    sort: 'transactionDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: { equalValue: false },
        paymentMethod: { equalValue: 'CASH' }
      }
    }
  }
};
