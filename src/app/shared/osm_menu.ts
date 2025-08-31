import { Navigation } from 'src/app/theme/types/navigation';
import { Role } from 'src/app/theme/types/role';

export const osm_menus: Navigation[] = [
  // ────────────────────────
  // Accueil / Tableau de bord
  // ────────────────────────
  {
    // id: 'group-dashboard',
    // title: 'MENU.HOME.TITLE',
    // type: 'group',
    // children: [
    //   {
        id: 'Dashboard',
        title: 'MENU.HOME.DASHBOARD.TITLE',
        type: 'group',
        // icon: 'dashboard',
        children: [
          // {
          //   id: 'item-dashboard-home',
          //   title: 'MENU.HOME.DASHBOARD.DEFAULT',
          //   type: 'item',
          //   url: '/dashboard',
          //   icon: 'space_dashboard',
          //   breadcrumbs: false,
          //   modulePermission: 'RECEPTION'
          // },
          // {
          //   id: 'item-dashboard-analytics',
          //   title: 'MENU.HOME.DASHBOARD.ANALYTICS',
          //   type: 'item',
          //   url: '/dashboard/analytics',
          //   icon: 'bar_chart',
          //   breadcrumbs: false
          // },
          {
            id: 'item-dashboard-finance',
            title: 'MENU.HOME.DASHBOARD.FINANCE',
            type: 'item',
            url: '/finance/dashboard',
            icon: 'show_chart',
            breadcrumbs: false
          },
          {
            id: 'item-dashboard-reception-overview',
            title: 'MENU.HOME.DASHBOARD.RECEPTION',
            type: 'item',
            url: '/reception',
            icon: 'assignment',
            breadcrumbs: false
          },{
            id: 'item-storage-storage_recap',
            title: 'MENU.HOME.DASHBOARD.STORAGE_RECAP',
            type: 'item',
            url: '/storage/storage_recap',
            icon: 'water_drop',
            role: [Role.Admin],
            breadcrumbs: false
          },
      //   ]
      // }
    ]
  },

  // =========================
  // RECEPTION (>3 items → wrapped)
  // =========================
  {
    id: 'group-reception',
    title: 'MENU.RECEPTION.TITLE',
    type: 'group',

    children: [
      {
        id: 'collapse-group-reception',
        title: 'MENU.RECEPTION.TITLE', // unchanged key
        type: 'collapse',
        icon: 'local_mall',
        children: [
          {
            id: 'item-reception-olive',
            title: 'MENU.RECEPTION.OLIVE',
            type: 'item',
            url: '/reception/reception-olive',
            icon: 'shopping_basket',
            breadcrumbs: false,
            ressourcePermission: 'UNIFIEDDELIVERY'
          },
          {
            id: 'item-reception-oil',
            title: 'MENU.RECEPTION.OIL',
            type: 'item',
            url: '/reception/reception-huile',
            icon: 'local_shipping',
            breadcrumbs: false,
            ressourcePermission: 'UNIFIEDDELIVERY'
          },
          {
            id: 'item-reception-quality',
            title: 'MENU.RECEPTION.QUALITY_CONTROL',
            type: 'item',
            url: '/reception/quality',
            icon: 'rule',
            breadcrumbs: false,
            ressourcePermission: 'QUALITYCONTROLRESULT'
          },

        ]
      }
    ]
  },

  // =========================
  // PRODUCTION (≤3 items → keep flat)
  // =========================
  {
    id: 'group-production',
    title: 'MENU.PRODUCTION.TITLE',
    type: 'group',

    children: [
      {
        id: 'triturationHistory',
        title: 'MENU.PRODUCTION.MILLING_HISTORY',
        type: 'item',
        url: '/reception/reception-list',
        icon: 'fact_check',
        breadcrumbs: false,
        permissions: ['RECEPTION:UNIFIEDDELIVERY:DELIVERYHISTORY']
      },
      {
        id: 'item-production-mill-schedules',
        title: 'MENU.PRODUCTION.MILLING_SCHEDULE',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'schedule',
        breadcrumbs: false,
        permissions: ['RECEPTION:UNIFIEDDELIVERY:PLANNING']
      },
      {
        id: 'item-reception-supplier-manage',
        title: 'MENU.RECEPTION.SUPPLIERS',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'contact_page',
        breadcrumbs: false,
        ressourcePermission: 'SUPPLIER'
      }
      // (If your original file also duplicated supplier routes here, add them back below unchanged)
      // {
      //   id: 'item-production-supplier-dashboard',
      //   title: 'MENU.SUPPLIER.DASHBOARD',
      //   type: 'item',
      //   url: '/supplier/dashboard',
      //   icon: 'grid_view',
      //   breadcrumbs: false
      // },
      // {
      //   id: 'item-production-supplier-history',
      //   title: 'MENU.SUPPLIER.HISTORY',
      //   type: 'item',
      //   url: '/supplier/history',
      //   icon: 'history',
      //   breadcrumbs: false
      // }
    ]
  },

  // // =========================
  // // SUPPLIER (≤3 items → keep flat)
  // // =========================
  // {
  //   id: 'group-supplier',
  //   title: 'MENU.SUPPLIER.TITLE',
  //   type: 'group',
  //   modulePermission: 'SUPPLIER',
  //   children: [
  //     {
  //       id: 'item-supplier-dashboard',
  //       title: 'MENU.SUPPLIER.DASHBOARD',
  //       type: 'item',
  //       url: '/supplier/dashboard',
  //       icon: 'grid_view',
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'item-supplier-history',
  //       title: 'MENU.SUPPLIER.HISTORY',
  //       type: 'item',
  //       url: '/supplier/history',
  //       icon: 'history',
  //       breadcrumbs: false
  //     }
  //   ]
  // },

  // =========================
  // FINANCE (>3 items → wrapped)
  // =========================
  {
    id: 'group-finance',
    title: 'MENU.FINANCE.TITLE',
    type: 'group',
    modulePermission: 'FINANCE',
    children: [
      {
        id: 'collapse-group-finance',
        title: 'MENU.FINANCE.TITLE', // unchanged key
        type: 'collapse',
        icon: 'account_balance',
        children: [
          {
            id: 'item-finance-expenses',
            title: 'MENU.FINANCE.EXPENSES',
            type: 'item',
            url: '/finance/expenses',
            icon: 'receipt_long',
            breadcrumbs: false
          },
          {
            id: 'item-finance-transactions',
            title: 'MENU.FINANCE.TRANSACTIONS',
            type: 'item',
            url: '/finance/transactions',
            icon: 'sync_alt',
            breadcrumbs: false
          },
          {
            id: 'item-finance-banks',
            title: 'MENU.FINANCE.BANK_MANAGEMENT',
            type: 'item',
            url: '/finance/banks',
            icon: 'account_balance',
            breadcrumbs: false
          },
          {
            id: 'item-finance-oil-credit',
            title: 'MENU.FINANCE.OIL_CREDIT',
            type: 'item',
            url: '/finance/oil-credit',
            icon: 'credit_score',
            breadcrumbs: false
          },

          {
            id: 'item-finance-oil-sales',
            title: 'MENU.FINANCE.OIL_SALES',
            type: 'item',
            url: '/finance/oil-sales',
            icon: 'sell',
            breadcrumbs: false
          },
          {
            id: 'item-finance-waste-sales',
            title: 'MENU.FINANCE.WASTE_MANAGEMENT',
            type: 'item',
            url: '/finance/waste-sales',
            icon: 'recycling',
            breadcrumbs: false
          }
        ]
      }
    ]
  },

  // =========================
  // STORAGE (==3 items → keep flat)
  // =========================
  {
    id: 'group-storage',
    title: 'MENU.STORAGE.TITLE',
    type: 'group',
    modulePermission: 'STORAGEUNIT',
    children: [
      {
        id: 'item-storage-units',
        title: 'MENU.STORAGE.OIL_STORAGE_UNITS',
        type: 'item',
        url: '/storage',
        icon: 'warehouse',
        breadcrumbs: false
      },
      {
        id: 'item-storage-oil-transactions',
        title: 'MENU.FINANCE.OIL_TRANSACTIONS',
        type: 'item',
        url: '/storage/oil-transactions',
        icon: 'water_drop',
        role: [Role.Admin],
        breadcrumbs: false
      },
      {
        id: 'item-storage-containers',
        title: 'OIL_CONTAINER_MANAGEMENT',
        type: 'item',
        url: '/storage/oil-container',
        icon: 'inbox',
        role: [Role.Admin],
        breadcrumbs: false
      }
    ]
  },

  // =========================
  // SETTINGS (>3 items → wrapped)
  // =========================
  {
    id: 'group-settings',
    title: 'MENU.SETTINGS.TITLE',
    type: 'group',
    modulePermission: 'SETTINGS',
    children: [
      {
        id: 'collapse-group-settings',
        title: 'MENU.SETTINGS.TITLE', // unchanged key
        type: 'collapse',
        icon: 'settings',
        children: [
          {
            id: 'item-settings-general-config',
            title: 'MENU.SETTINGS.GENERAL_CONFIG',
            type: 'item',
            url: '/settings/general-config',
            icon: 'settings_suggest',
            breadcrumbs: false
          },
          {
            id: 'item-settings-configuration',
            title: 'MENU.SETTINGS.APP_UI',
            type: 'item',
            url: '/settings/configuration',
            icon: 'widgets',
            breadcrumbs: false
          },
          {
            id: 'item-settings-generic',
            title: 'MENU.SETTINGS.GENERIC_TYPES',
            type: 'item',
            url: '/settings/generic',
            icon: 'category',
            breadcrumbs: false
          },
          {
            id: 'item-settings-quality-rules',
            title: 'MENU.SETTINGS.QUALITY_CONTROL_RULES',
            type: 'item',
            url: '/settings/quality-control',
            icon: 'rule',
            breadcrumbs: false
          },
          {
            id: 'item-settings-mill-machines',
            title: 'MENU.SETTINGS.MILLING_MACHINES',
            type: 'item',
            url: '/reception/mill-machines',
            icon: 'precision_manufacturing',
            breadcrumbs: false
          },
          {
            id: 'item-settings-users',
            title: 'MENU.SETTINGS.USERS',
            type: 'item',
            url: '/settings/users',
            icon: 'people',
            breadcrumbs: false
          },
          {
            id: 'item-settings-roles',
            title: 'MENU.SETTINGS.ROLES',
            type: 'item',
            url: '/settings/roles',
            icon: 'admin_panel_settings',
            breadcrumbs: false
          }
        ]
      }
    ]
  },

  // =========================
  // (Optional future sections; keep commented if not used)
  // =========================
  {
    id: 'group-settings',
    title: 'MENU.HR.TITLE',
    type: 'group',
    modulePermission: 'HR',
    children: [
      {
        id: 'item-settings-roles',
        title: 'MENU.HR.EMPLOYEES',
        type: 'item',
        url: '/hr/employee',
        icon: 'admin_panel_settings',
        breadcrumbs: false
      }
    ]
  }
];
