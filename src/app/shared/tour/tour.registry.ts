/**
 * Guided tours, matched against the current URL (first match wins, so specific patterns come first).
 * Texts live under TOUR.<id> in the i18n files; bump `version` when a tour's content changes
 * so users see it again.
 */
export type TourStepKind = 'intro' | 'menu' | 'header' | 'actions' | 'fields' | 'data' | 'tabs' | 'replay';

/**
 * Points at the element marked `data-tour="<target>"`. Texts come from TOUR.<id>.<KEY>_TITLE / TOUR.<id>.<KEY>,
 * falling back to TOUR.STEP.<KEY>; KEY defaults to the target in upper snake case (`list-new` -> `LIST_NEW`).
 */
export interface TourElementStep {
  target: string;
  key?: string;
}

export type TourStep = TourStepKind | TourElementStep;

export interface TourDefinition {
  id: string;
  version: number;
  match: RegExp;
  steps: TourStep[];
}

const el = (target: string): TourElementStep => ({ target });

export function elementStepKey(step: TourElementStep): string {
  return step.key ?? step.target.toUpperCase().replace(/-/g, '_');
}

const LIST_PAGE: TourStepKind[] = ['intro', 'menu', 'header', 'actions', 'fields', 'data', 'replay'];
const FORM_PAGE: TourStepKind[] = ['intro', 'menu', 'header', 'fields', 'actions', 'replay'];
const DASHBOARD_PAGE: TourStepKind[] = ['intro', 'menu', 'header', 'tabs', 'data', 'replay'];

/** Pages built on the shared `oosm-dashboard` list. */
const LIST_STEPS: TourStep[] = [el('list-new'), el('list-filter'), el('list-data'), el('list-row-actions'), el('list-export')];
const OOSM_LIST: TourStep[] = ['intro', 'menu', ...LIST_STEPS, 'replay'];

const RECEPTION_FORM: TourStep[] = [
  'intro',
  el('reception-delivery'),
  el('reception-party'),
  el('reception-goods'),
  el('reception-save'),
  'replay'
];

export const SHELL_TOUR_ID = 'SHELL';
export const SHELL_TOUR_VERSION = 1;

export const MODULE_TOURS: TourDefinition[] = [
  {
    id: 'ADMIN_DASHBOARD',
    version: 1,
    match: /^\/dashboard\/administration$|^\/administration(\/dashboard)?$/,
    steps: [
      'intro',
      'menu',
      el('admin-health'),
      el('admin-kpis'),
      el('admin-attention'),
      el('admin-companies'),
      el('admin-modules'),
      el('admin-support'),
      el('dash-export'),
      'replay'
    ]
  },
  { id: 'DASHBOARD', version: 2, match: /^\/dashboard(\/|$)/, steps: ['intro', 'menu', el('hub-tabs'), el('hub-panel'), 'replay'] },

  {
    id: 'RECEPTION_IMPORT',
    version: 2,
    match: /^\/reception\/import$/,
    steps: [
      'intro',
      'menu',
      el('import-download'),
      el('import-rules'),
      el('import-upload'),
      el('import-dry-run'),
      el('import-summary'),
      el('import-invalid'),
      el('import-commit'),
      el('import-drive'),
      'replay'
    ]
  },
  { id: 'RECEPTION_OLIVE_FORM', version: 1, match: /^\/reception\/reception-olive\/[a-z_]+\/[^/]+$/, steps: RECEPTION_FORM },
  { id: 'RECEPTION_OLIVE', version: 2, match: /^\/reception\/reception-olive\/[^/]+$/, steps: OOSM_LIST },
  { id: 'RECEPTION_OIL_FORM', version: 1, match: /^\/reception\/reception-huile\/[^/]+$/, steps: RECEPTION_FORM },
  { id: 'RECEPTION_OIL', version: 2, match: /^\/reception\/reception-huile$/, steps: OOSM_LIST },
  {
    id: 'RECEPTION_DETAILS',
    version: 1,
    match: /^\/reception\/reception-details\/[^/]+$/,
    steps: [
      'intro',
      el('details-status'),
      el('details-qr'),
      el('details-counterpart'),
      el('details-links'),
      el('details-price'),
      el('details-quality'),
      'replay'
    ]
  },
  { id: 'PURCHASE_JOURNAL', version: 1, match: /^\/reception\/purchase-journal(\/|$)/, steps: OOSM_LIST },
  { id: 'RECEPTION_JOURNAL', version: 2, match: /^\/reception\/reception-list(\/|$)/, steps: OOSM_LIST },
  { id: 'RECEPTION_PLANNING', version: 1, match: /^\/reception\/mill-schedules$/, steps: LIST_PAGE },
  {
    id: 'SUPPLIER_FORM',
    version: 1,
    match: /^\/reception\/fournisseur\/(new|edit\/[^/]+)$/,
    steps: ['intro', el('supplier-identity'), el('supplier-type'), el('supplier-bank'), el('supplier-save'), 'replay']
  },
  {
    id: 'SUPPLIER_DETAILS',
    version: 1,
    match: /^\/reception\/fournisseur\/.+|^\/fournisseur$/,
    steps: ['intro', el('supplier-tabs'), el('supplier-operations'), el('list-data'), el('supplier-finance'), el('supplier-profile'), 'replay']
  },
  { id: 'SUPPLIERS', version: 2, match: /^\/reception\/fournisseur$/, steps: OOSM_LIST },
  { id: 'QUALITY', version: 2, match: /^\/reception\/(olive_qc|oil_qc)$/, steps: OOSM_LIST },
  { id: 'QUALITY_ENTRY', version: 1, match: /^\/reception\/quality\/.+/, steps: FORM_PAGE },
  { id: 'QUALITY_RULES', version: 1, match: /^\/qcr$|^\/settings\/quality-control(\/|$)/, steps: OOSM_LIST },
  { id: 'MILL_MACHINES', version: 1, match: /^\/reception\/mill-machines$/, steps: OOSM_LIST },
  { id: 'MAINTENANCE', version: 1, match: /^\/maintenance$/, steps: OOSM_LIST },
  { id: 'MILL_EQUIPMENT', version: 1, match: /^\/mill-equipment$/, steps: OOSM_LIST },
  { id: 'EQUIPMENT_MISSIONS', version: 1, match: /^\/equipment-missions$/, steps: OOSM_LIST },
  { id: 'EQUIPMENT', version: 1, match: /^\/(maintenance|mill-equipment|equipment-missions)(\/|$)|^\/reception\/mill-machines(\/|$)/, steps: LIST_PAGE },
  {
    id: 'RECEPTION_DASHBOARD',
    version: 2,
    match: /^\/reception(\/(dashboard|reception-dashboard))?$/,
    steps: [
      'intro',
      'menu',
      el('dash-filters'),
      el('reception-daily-metric'),
      el('reception-kpis'),
      el('reception-trend'),
      el('dash-export'),
      el('dash-refresh'),
      'replay'
    ]
  },

  { id: 'STORAGE_UNITS', version: 1, match: /^\/storage$/, steps: OOSM_LIST },
  {
    id: 'STORAGE_FORM',
    version: 1,
    match: /^\/storage\/(new|[^/]+\/edit)$/,
    steps: ['intro', el('storage-identity'), el('storage-oil'), el('storage-paid'), el('storage-save'), 'replay']
  },
  {
    id: 'STORAGE_RECAP',
    version: 1,
    match: /^\/storage\/storage_recap$/,
    steps: ['intro', 'menu', el('dash-filters'), el('storage-card'), el('storage-fill'), el('dash-export'), 'replay']
  },
  {
    id: 'OIL_TRANSACTION_FORM',
    version: 1,
    match: /^\/storage\/oil-transactions\/(new|[^/]+\/(edit|validate))$/,
    steps: ['intro', el('tx-type'), el('tx-units'), el('tx-quantity'), el('tx-price'), el('tx-save'), 'replay']
  },
  { id: 'OIL_TRANSACTIONS', version: 1, match: /^\/storage\/oil-transactions$/, steps: OOSM_LIST },
  {
    id: 'OIL_FILTERING_FORM',
    version: 1,
    match: /^\/storage\/oil-filtering\/(new|[^/]+\/edit)$/,
    steps: ['intro', el('filtering-units'), el('filtering-volume'), el('filtering-save'), 'replay']
  },
  { id: 'OIL_FILTERING', version: 1, match: /^\/storage\/oil-filtering$/, steps: OOSM_LIST },
  { id: 'OIL_CONTAINERS', version: 1, match: /^\/storage\/oil-container$/, steps: OOSM_LIST },
  { id: 'STORAGE', version: 1, match: /^\/storage(\/|$)/, steps: LIST_PAGE },

  { id: 'OF_ORDERS', version: 1, match: /^\/of$/, steps: OOSM_LIST },
  { id: 'LABELS', version: 1, match: /^\/labels$/, steps: OOSM_LIST },
  { id: 'PROJECTS', version: 1, match: /^\/projets$/, steps: OOSM_LIST },
  { id: 'PRODUCTS', version: 1, match: /^\/stock\/(products|skus)$/, steps: OOSM_LIST },
  { id: 'BOMS', version: 1, match: /^\/stock\/boms$/, steps: OOSM_LIST },
  { id: 'PACKAGING_LINES', version: 1, match: /^\/stock\/lignes$/, steps: OOSM_LIST },
  { id: 'STOCK_ARTICLES', version: 1, match: /^\/stock\/articles$/, steps: OOSM_LIST },
  { id: 'CONDITIONING', version: 1, match: /^\/(of|labels|projets)(\/|$)|^\/stock\/(lignes|articles|products|boms)(\/|$)/, steps: LIST_PAGE },

  {
    id: 'STOCK_DASHBOARD',
    version: 1,
    match: /^\/stock(\/dashboard)?$/,
    steps: ['intro', 'menu', el('stock-thresholds'), el('stock-summary'), el('stock-critical'), el('stock-movements'), el('dash-export'), 'replay']
  },
  { id: 'STOCK_MOVEMENTS', version: 1, match: /^\/stock\/mouvements$/, steps: OOSM_LIST },
  { id: 'STOCK_LOCATIONS', version: 1, match: /^\/stock\/(emplacements|par-emplacement)$/, steps: OOSM_LIST },
  { id: 'PURCHASE_ORDERS', version: 1, match: /^\/stock\/bons-commande$/, steps: OOSM_LIST },
  { id: 'MATERIAL_SUPPLIERS', version: 1, match: /^\/stock\/materiel-suppliers$/, steps: OOSM_LIST },
  { id: 'STOCK', version: 1, match: /^\/stock(\/|$)/, steps: LIST_PAGE },

  {
    id: 'FINANCE_DASHBOARD',
    version: 1,
    match: /^\/finance(\/dashboard)?$/,
    steps: ['intro', 'menu', el('dash-filters'), el('finance-kpis'), el('finance-overview'), el('finance-recent'), el('dash-export'), 'replay']
  },
  {
    id: 'CASH_REGISTER',
    version: 1,
    match: /^\/finance\/cash-register$/,
    steps: ['intro', 'menu', el('dash-filters'), el('cash-opening'), el('cash-summary'), el('cash-methods'), el('list-new'), el('list-data'), el('dash-export'), 'replay']
  },
  {
    id: 'SEASON_RECAP',
    version: 1,
    match: /^\/finance\/season-recap$/,
    steps: ['intro', 'menu', el('season-grid'), el('season-sales'), el('season-cash'), 'replay']
  },
  { id: 'BANKS', version: 1, match: /^\/finance\/banks$/, steps: OOSM_LIST },
  { id: 'EXPENSES', version: 1, match: /^\/finance\/expenses$/, steps: OOSM_LIST },
  { id: 'OIL_SALES', version: 1, match: /^\/finance\/oil-sales$/, steps: OOSM_LIST },
  { id: 'OIL_CREDIT', version: 1, match: /^\/finance\/oil-credit$/, steps: OOSM_LIST },
  { id: 'TRANSACTIONS', version: 1, match: /^\/finance\/transactions$/, steps: OOSM_LIST },
  { id: 'WASTE_SALES', version: 1, match: /^\/finance\/waste-sales$/, steps: OOSM_LIST },
  { id: 'FINANCE', version: 1, match: /^\/finance(\/|$)/, steps: LIST_PAGE },

  { id: 'HR_DASHBOARD', version: 1, match: /^\/hr$/, steps: ['intro', 'menu', el('hr-kpis'), el('hr-nav'), el('dash-export'), 'replay'] },
  { id: 'HR_EMPLOYEES', version: 1, match: /^\/hr\/employees$/, steps: OOSM_LIST },
  { id: 'HR_TIME', version: 1, match: /^\/hr\/(pointages|timesheets|overtime-requests)$/, steps: OOSM_LIST },
  { id: 'HR_LEAVE', version: 1, match: /^\/hr\/(leave-requests|leave-types|public-holidays)$/, steps: OOSM_LIST },
  {
    id: 'HR_PAYROLL',
    version: 1,
    match: /^\/hr\/(payroll-periods|payslips|payroll-variables|salary-advances|employee-loans)$/,
    steps: OOSM_LIST
  },
  { id: 'HR', version: 1, match: /^\/hr(\/|$)/, steps: LIST_PAGE },

  { id: 'SETTINGS_USERS', version: 1, match: /^\/settings\/users(\/dashboard)?$/, steps: OOSM_LIST },
  {
    id: 'SETTINGS_USER_FORM',
    version: 1,
    match: /^\/settings\/users\/(add|update\/[^/]+|view\/[^/]+)$/,
    steps: ['intro', 'fields', el('user-confirmation'), el('user-role'), el('user-locked'), el('user-save'), 'replay']
  },
  { id: 'SETTINGS_ROLES', version: 1, match: /^\/settings\/roles(\/dashboard)?$/, steps: ['intro', 'menu', el('roles-new'), el('roles-grid'), 'replay'] },
  { id: 'SETTINGS', version: 1, match: /^\/(settings|generic)(\/|$)/, steps: LIST_PAGE },
  { id: 'ADMINISTRATION', version: 1, match: /^\/administration(\/|$)/, steps: LIST_PAGE },
  { id: 'ANALYTICS', version: 1, match: /^\/analytics(\/|$)/, steps: DASHBOARD_PAGE },
  { id: 'NOTIFICATIONS', version: 1, match: /^\/notifications$/, steps: ['intro', 'header', 'data', 'replay'] }
];

/** Where each step points; the first visible match is used and steps without a target are dropped. */
export const STEP_TARGETS: Record<Exclude<TourStepKind, 'intro'>, string[]> = {
  menu: ['.pc-sidebar .nav-link--selected', '.pc-sidebar .nav-item--expanded', '.pc-sidebar .nav-link.active'],
  header: ['.page-wrapper .page-header__left', '.page-wrapper .page-header', '.page-wrapper .page-header-shell', 'app-breadcrumb'],
  actions: [
    '.page-wrapper .page-header__right',
    '.page-wrapper button[color="primary"]:not([disabled])',
    '.page-wrapper .mat-mdc-unelevated-button:not([disabled])'
  ],
  fields: ['.page-wrapper form', '.page-wrapper mat-form-field'],
  data: ['.page-wrapper table', '.page-wrapper .mat-mdc-table', '.page-wrapper mat-card', '.page-wrapper .card'],
  tabs: ['.page-wrapper mat-tab-group', '.page-wrapper .mat-mdc-tab-group', '.page-wrapper nav[mat-tab-nav-bar]'],
  replay: ['[data-tour="replay"]']
};

export const SHELL_TARGETS: { key: string; selector: string }[] = [
  { key: 'MENU', selector: '.pc-sidebar nav' },
  { key: 'SEARCH', selector: '.global-search-wrapper' },
  { key: 'HELP', selector: '[data-tour="help"]' },
  { key: 'SUPPORT', selector: '[data-tour="support"]' },
  { key: 'NOTIFICATIONS', selector: '[data-tour="notifications"]' },
  { key: 'PROFILE', selector: '[data-tour="profile"]' }
];

export function findModuleTour(url: string): TourDefinition | undefined {
  const path = url.split(/[?#]/)[0];
  return MODULE_TOURS.find((tour) => tour.match.test(path));
}
