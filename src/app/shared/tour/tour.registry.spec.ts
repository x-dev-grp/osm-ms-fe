import { elementStepKey, findModuleTour, MODULE_TOURS } from './tour.registry';

describe('tour registry', () => {
  const cases: [string, string | undefined][] = [
    ['/dashboard', 'DASHBOARD'],
    ['/dashboard/reception', 'DASHBOARD'],
    ['/dashboard/administration', 'ADMIN_DASHBOARD'],
    ['/administration/dashboard', 'ADMIN_DASHBOARD'],
    ['/reception', 'RECEPTION_DASHBOARD'],
    ['/reception/dashboard', 'RECEPTION_DASHBOARD'],
    ['/reception/reception-olive/simple_reception', 'RECEPTION_OLIVE'],
    ['/reception/reception-olive/simple_reception/new', 'RECEPTION_OLIVE_FORM'],
    ['/reception/reception-olive/simple_reception/12', 'RECEPTION_OLIVE_FORM'],
    ['/reception/reception-huile', 'RECEPTION_OIL'],
    ['/reception/reception-huile/5', 'RECEPTION_OIL_FORM'],
    ['/reception/reception-details/3', 'RECEPTION_DETAILS'],
    ['/reception/import', 'RECEPTION_IMPORT'],
    ['/reception/reception-list/olive?page=2', 'RECEPTION_JOURNAL'],
    ['/reception/purchase-journal', 'PURCHASE_JOURNAL'],
    ['/reception/mill-schedules', 'RECEPTION_PLANNING'],
    ['/reception/fournisseur', 'SUPPLIERS'],
    ['/reception/fournisseur/new', 'SUPPLIER_FORM'],
    ['/reception/fournisseur/edit/4', 'SUPPLIER_FORM'],
    ['/reception/fournisseur/details/4', 'SUPPLIER_DETAILS'],
    ['/fournisseur', 'SUPPLIER_DETAILS'],
    ['/reception/olive_qc', 'QUALITY'],
    ['/reception/quality/olive/2', 'QUALITY_ENTRY'],
    ['/qcr', 'QUALITY_RULES'],
    ['/reception/mill-machines', 'MILL_MACHINES'],
    ['/reception/mill-machines/view/3', 'EQUIPMENT'],
    ['/maintenance', 'MAINTENANCE'],
    ['/maintenance/new', 'EQUIPMENT'],
    ['/equipment-missions', 'EQUIPMENT_MISSIONS'],
    ['/storage', 'STORAGE_UNITS'],
    ['/storage/new', 'STORAGE_FORM'],
    ['/storage/7/edit', 'STORAGE_FORM'],
    ['/storage/storage_recap', 'STORAGE_RECAP'],
    ['/storage/oil-transactions', 'OIL_TRANSACTIONS'],
    ['/storage/oil-transactions/new', 'OIL_TRANSACTION_FORM'],
    ['/storage/oil-filtering', 'OIL_FILTERING'],
    ['/storage/oil-filtering/new', 'OIL_FILTERING_FORM'],
    ['/storage/oil-container', 'OIL_CONTAINERS'],
    ['/storage/1/view', 'STORAGE'],
    ['/of', 'OF_ORDERS'],
    ['/of/3', 'CONDITIONING'],
    ['/stock/articles', 'STOCK_ARTICLES'],
    ['/stock/skus', 'PRODUCTS'],
    ['/stock', 'STOCK_DASHBOARD'],
    ['/stock/dashboard', 'STOCK_DASHBOARD'],
    ['/stock/mouvements', 'STOCK_MOVEMENTS'],
    ['/stock/par-emplacement', 'STOCK_LOCATIONS'],
    ['/stock/bons-commande', 'PURCHASE_ORDERS'],
    ['/finance', 'FINANCE_DASHBOARD'],
    ['/finance/cash-register', 'CASH_REGISTER'],
    ['/finance/season-recap', 'SEASON_RECAP'],
    ['/finance/oil-sales', 'OIL_SALES'],
    ['/finance/oil-sales/new', 'FINANCE'],
    ['/hr', 'HR_DASHBOARD'],
    ['/hr/employees', 'HR_EMPLOYEES'],
    ['/hr/pointages', 'HR_TIME'],
    ['/hr/leave-requests', 'HR_LEAVE'],
    ['/hr/payslips', 'HR_PAYROLL'],
    ['/hr/contracts', 'HR'],
    ['/settings/users/dashboard', 'SETTINGS_USERS'],
    ['/settings/users/add', 'SETTINGS_USER_FORM'],
    ['/settings/roles/dashboard', 'SETTINGS_ROLES'],
    ['/settings/general-config', 'SETTINGS'],
    ['/administration/companies', 'ADMINISTRATION'],
    ['/notifications', 'NOTIFICATIONS'],
    ['/help', undefined],
    ['/access-denied', undefined]
  ];

  for (const [url, expected] of cases) {
    it(`${url} -> ${expected ?? 'no tour'}`, () => {
      expect(findModuleTour(url)?.id).toBe(expected);
    });
  }

  it('has unique tour ids', () => {
    const ids = MODULE_TOURS.map((tour) => tour.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives upper snake case keys for element steps', () => {
    expect(elementStepKey({ target: 'list-row-actions' })).toBe('LIST_ROW_ACTIONS');
    expect(elementStepKey({ target: 'list-new', key: 'CUSTOM' })).toBe('CUSTOM');
    for (const tour of MODULE_TOURS) {
      for (const step of tour.steps) {
        if (typeof step !== 'string') {
          expect(elementStepKey(step)).toMatch(/^[A-Z][A-Z0-9_]*$/);
        }
      }
    }
  });
});
