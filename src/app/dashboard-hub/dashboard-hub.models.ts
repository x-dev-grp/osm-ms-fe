export type DashboardTabId =
  | 'overview'
  | 'reception'
  | 'finance'
  | 'storage'
  | 'inventory'
  | 'hr'
  | 'analytics'
  | 'administration';

export interface DashboardTabDefinition {
  id: DashboardTabId;
  labelKey: string;
  icon: string;
  accentClass: string;
}

export const DASHBOARD_TAB_ORDER: DashboardTabId[] = [
  'overview',
  'reception',
  'finance',
  'storage',
  'inventory',
  'hr',
  'analytics',
  'administration'
];

export const DASHBOARD_TAB_REGISTRY: DashboardTabDefinition[] = [
  {
    id: 'overview',
    labelKey: 'DASHBOARD_HUB.TABS.OVERVIEW',
    icon: 'home',
    accentClass: 'dashboard-hub-tab--overview'
  },
  {
    id: 'reception',
    labelKey: 'DASHBOARD_HUB.TABS.RECEPTION',
    icon: 'spa',
    accentClass: 'dashboard-hub-tab--reception'
  },
  {
    id: 'finance',
    labelKey: 'DASHBOARD_HUB.TABS.FINANCE',
    icon: 'account_balance',
    accentClass: 'dashboard-hub-tab--finance'
  },
  {
    id: 'storage',
    labelKey: 'DASHBOARD_HUB.TABS.STORAGE',
    icon: 'water_drop',
    accentClass: 'dashboard-hub-tab--storage'
  },
  {
    id: 'inventory',
    labelKey: 'DASHBOARD_HUB.TABS.INVENTORY',
    icon: 'inventory_2',
    accentClass: 'dashboard-hub-tab--inventory'
  },
  {
    id: 'hr',
    labelKey: 'DASHBOARD_HUB.TABS.HR',
    icon: 'groups',
    accentClass: 'dashboard-hub-tab--hr'
  },
  {
    id: 'analytics',
    labelKey: 'DASHBOARD_HUB.TABS.ANALYTICS',
    icon: 'insights',
    accentClass: 'dashboard-hub-tab--analytics'
  },
  {
    id: 'administration',
    labelKey: 'DASHBOARD_HUB.TABS.ADMINISTRATION',
    icon: 'admin_panel_settings',
    accentClass: 'dashboard-hub-tab--administration'
  }
];
