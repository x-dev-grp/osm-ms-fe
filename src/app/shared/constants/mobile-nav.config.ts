import { Navigation, NavigationItem } from '../../theme/types/navigation';

export interface MobileNavTab {
  id: string;
  labelKey: string;
  icon: string;
  /** Direct navigation when the tab has no sub-menu (e.g. Home). */
  url?: string;
  routePrefixes: string[];
  /** Opens a bottom sheet with this menu group's children. */
  menuGroupId?: string;
}

export const MOBILE_NAV_MORE_TAB_ID = 'more';

/** Stock paths that belong to Conditionnement (catalog / lines), not Inventaire. */
const CONDITIONING_STOCK_PREFIXES = [
  '/stock/lignes',
  '/stock/articles',
  '/stock/products',
  '/stock/boms',
  '/stock/audit'
];

export const OOSM_MOBILE_NAV_TABS: MobileNavTab[] = [
  {
    id: 'home',
    labelKey: 'MOBILE_NAV.HOME',
    icon: 'home',
    url: '/dashboard',
    routePrefixes: ['/dashboard', '/welcome', '/home']
  },
  {
    id: 'reception',
    labelKey: 'MENU.RECEPTION.TITLE',
    icon: 'spa',
    routePrefixes: ['/reception'],
    menuGroupId: 'group-reception'
  },
  {
    id: 'production',
    labelKey: 'MENU.PRODUCTION.MILL_TITLE',
    icon: 'precision_manufacturing',
    routePrefixes: ['/storage', '/reception/oil_qc', '/reception/olive_qc'],
    menuGroupId: 'group-production'
  },
  {
    id: 'conditioning',
    labelKey: 'MENU.CONDITIONNEMENT.TITLE',
    icon: 'inventory_2',
    routePrefixes: ['/of', '/labels', '/projets', '/analytics', ...CONDITIONING_STOCK_PREFIXES],
    menuGroupId: 'group-conditioning'
  }
];

export const OOSM_MOBILE_PRIMARY_GROUP_IDS = OOSM_MOBILE_NAV_TABS.map((tab) => tab.menuGroupId).filter(
  (id): id is string => !!id
);

export const ADMIN_MOBILE_NAV_TABS: MobileNavTab[] = [
  {
    id: 'dashboard',
    labelKey: 'DASHBOARD_HUB.TITLE',
    icon: 'dashboard',
    url: '/dashboard/administration',
    routePrefixes: ['/dashboard', '/administration/dashboard']
  },
  {
    id: 'companies',
    labelKey: 'MENU.ADMINISTRATION.COMPANY_PROFILES',
    icon: 'business',
    url: '/administration/companies',
    routePrefixes: ['/administration/companies']
  },
  {
    id: 'users',
    labelKey: 'MENU.ADMINISTRATION.USERS',
    icon: 'manage_accounts',
    url: '/administration/users',
    routePrefixes: ['/administration/users']
  },
  {
    id: 'support',
    labelKey: 'MENU.ADMINISTRATION.SUPPORT',
    icon: 'support_agent',
    url: '/administration/support',
    routePrefixes: ['/administration/support']
  }
];

export const ADMIN_MOBILE_PRIMARY_URLS = ADMIN_MOBILE_NAV_TABS.map((tab) => tab.url).filter(
  (url): url is string => !!url
);

const PRODUCTION_ROUTE_PREFIXES = ['/storage', '/reception/oil_qc', '/reception/olive_qc'];

function matchesPrefix(normalized: string, prefix: string): boolean {
  return normalized === prefix || normalized.startsWith(`${prefix}/`) || normalized.startsWith(`${prefix};`);
}

export function findMenuGroupById(menus: Navigation[], groupId: string): Navigation | undefined {
  return menus.find((menu) => menu.id === groupId && menu.type === 'group');
}

export function getMoreMenuGroups(menus: Navigation[], primaryGroupIds: string[]): Navigation[] {
  return menus.filter((menu) => menu.type === 'group' && !primaryGroupIds.includes(menu.id));
}

export function getAdminMoreMenuItems(menus: Navigation[], primaryUrls: string[]): NavigationItem[] {
  const adminGroup = menus.find((menu) => menu.id === 'oosmAdminGroup');
  return (adminGroup?.children ?? []).filter(
    (item) => item.type === 'item' && item.url && !primaryUrls.includes(item.url)
  );
}

export function wrapMenuItemsAsGroup(items: NavigationItem[], title: string, id: string): Navigation[] {
  if (!items.length) {
    return [];
  }

  return [
    {
      id,
      title,
      type: 'group',
      children: items
    }
  ];
}

export function resolveMobileNavTabId(url: string, tabs: MobileNavTab[]): string {
  const normalized = (url ?? '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  if (normalized === '/') {
    return tabs[0]?.id ?? MOBILE_NAV_MORE_TAB_ID;
  }

  for (const prefix of PRODUCTION_ROUTE_PREFIXES) {
    if (matchesPrefix(normalized, prefix)) {
      const productionTab = tabs.find((tab) => tab.id === 'production');
      if (productionTab) {
        return productionTab.id;
      }
    }
  }

  for (const prefix of CONDITIONING_STOCK_PREFIXES) {
    if (matchesPrefix(normalized, prefix)) {
      const conditioningTab = tabs.find((tab) => tab.id === 'conditioning');
      if (conditioningTab) {
        return conditioningTab.id;
      }
    }
  }

  for (const tab of tabs) {
    for (const prefix of tab.routePrefixes) {
      if (prefix === '/reception' && PRODUCTION_ROUTE_PREFIXES.some((p) => matchesPrefix(normalized, p))) {
        continue;
      }

      if (CONDITIONING_STOCK_PREFIXES.includes(prefix)) {
        continue;
      }

      if (matchesPrefix(normalized, prefix)) {
        return tab.id;
      }
    }
  }

  return MOBILE_NAV_MORE_TAB_ID;
}
