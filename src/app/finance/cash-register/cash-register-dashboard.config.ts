import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { TRANSACTIONS_DASHBOARD_CONFIG } from '../transactions/transactions-dashboard.config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { DashboardDateRange } from '../../shared/components/dashboard/dashboard-preset.util';

/** Payment methods shown in the till (espèces + chèque + virement). */
export const CAISSE_PAYMENT_METHODS = ['CASH', 'CHEQUE', 'TRANSFER'] as const;

function toSearchDateTime(date: Date, endOfDay: boolean): string {
  const d = new Date(date);
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** ABIOOC caisse — liquidité: cash, cheque, transfer. */
export function buildCashRegisterDashboard(range: DashboardDateRange): DashboardConfig {
  const config = JSON.parse(JSON.stringify(TRANSACTIONS_DASHBOARD_CONFIG)) as DashboardConfig;
  config.icon = 'point_of_sale';
  config.addNewItem = true;
  config.addNewItemUrl = '/finance/transactions/new';
  config.titleTranslatePath = 'ABIOOC.CASH_REGISTER.TITLE';
  config.defaultSearchData = {
    page: 0,
    size: 50,
    sort: 'transactionDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: { equalValue: false },
        paymentMethod: { inValues: [...CAISSE_PAYMENT_METHODS] },
        transactionDate: {
          minValueOrEqual: toSearchDateTime(range.start, false),
          maxValueOrEqual: toSearchDateTime(range.end, true)
        }
      }
    }
  };
  return config;
}

export const CASH_REGISTER_DASHBOARD = buildCashRegisterDashboard({
  start: new Date(),
  end: new Date(),
  preset: 'today'
});

export { toSearchDateTime };
