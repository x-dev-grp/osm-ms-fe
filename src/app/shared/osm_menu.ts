import {Navigation} from 'src/app/@theme/types/navigation';
import {Role} from 'src/app/@theme/types/role';

export const osm_menus: Navigation[] = [
  // ────────────────────────
  // Accueil / Tableau de bord
  // ────────────────────────
  {
    id: 'navigation',
    title: 'MENU.HOME.TITLE',
    type: 'group',
    role: [Role.Admin, Role.User],
    modulePermission: 'RECEPTION',
    children: [
      {
        id: 'Dashboard',
        title: 'MENU.HOME.DASHBOARD.TITLE',
        type: 'collapse',
        icon: 'dashboard',
        role: [Role.Admin, Role.User],
        ressourcePermission: 'RECEPTION',
        children: [
          {
            id: 'default',
            title: 'MENU.HOME.DASHBOARD.DEFAULT',
            type: 'item',
            url: '/dashboard',
            icon: 'space_dashboard',
            breadcrumbs: false,
            permissions: ['RECEPTION:RECEPTION:DELETE']
          },
          {
            id: 'analytics',
            title: 'MENU.HOME.DASHBOARD.ANALYTICS',
            type: 'item',
            url: '/dashboard/analytics',
            icon: 'insights',
            role: [Role.Admin]
          },
          {
            id: 'finance',
            title: 'MENU.HOME.DASHBOARD.FINANCE',
            type: 'item',
            url: '/dashboard/finance',
            icon: 'account_balance_wallet',
            role: [Role.Admin]
          },
          {
            id: 'reception',
            title: 'MENU.HOME.DASHBOARD.RECEPTION',
            type: 'item',
            url: '/reception',
            icon: 'eco',
            role: [Role.Admin]
          }
        ]
      }
    ]
  },

  // ────────────────────────
  // Réception
  // ────────────────────────
  {
    id: 'receptionGroup',
    title: 'MENU.RECEPTION.TITLE',
    type: 'group',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'oliveReception',
        title: 'MENU.RECEPTION.OLIVE',
        type: 'item',
        url: '/reception/reception-olive',
        icon: 'eco',
        breadcrumbs: false
      },
      {
        id: 'oilReception',
        title: 'MENU.RECEPTION.OIL',
        type: 'item',
        url: '/reception/reception-huile',
        icon: 'water_drop',
        breadcrumbs: false
      },
      {
        id: 'qualityControlReception',
        title: 'MENU.RECEPTION.QUALITY_CONTROL',
        type: 'item',
        url: '/reception/quality',
        icon: 'verified',
        breadcrumbs: false
      },
      {
        id: 'receptionFournisseurs',
        title: 'MENU.RECEPTION.SUPPLIERS',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'business',
        breadcrumbs: false
      }
    ]
  },

  // ────────────────────────
  // Production
  // ────────────────────────
  {
    id: 'productionGroup',
    title: 'MENU.PRODUCTION.TITLE',
    type: 'group',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'triturationHistory',
        title: 'MENU.PRODUCTION.MILLING_HISTORY',
        type: 'item',
        url: '/reception/reception-list',
        icon: 'fact_check',
        breadcrumbs: false
      },
      {
        id: 'millingSchedule',
        title: 'MENU.PRODUCTION.MILLING_SCHEDULE',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'calendar_month',
        breadcrumbs: false
      },
      {
        id: 'supplierGroup',
        title: 'MENU.SUPPLIER.TITLE',
        type: 'group',
        icon: 'business',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'supplierDashboard',
            title: 'MENU.SUPPLIER.DASHBOARD',
            type: 'item',
            url: '/supplier/dashboard',
            icon: 'dashboard',
            breadcrumbs: false
          },
          {
            id: 'supplierHistory',
            title: 'MENU.SUPPLIER.HISTORY',
            type: 'item',
            url: '/supplier/history',
            icon: 'history',
            breadcrumbs: false
          }
        ]
      }
    ]
  },



  // ────────────────────────
  // Finance & Comptabilité
  // ────────────────────────
  {
    id: 'financeGroup',
    title: 'MENU.FINANCE.TITLE',
    type: 'group',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'Expenses',
        title: 'MENU.FINANCE.EXPENSES',
        type: 'item',
        url: '/finance/expenses',
        icon: 'payments',
        breadcrumbs: false
      },
      {
        id: 'transactions',
        title: 'MENU.FINANCE.TRANSACTIONS',
        type: 'item',
        url: '/finance/transactions',
        icon: 'account_balance_wallet',
        breadcrumbs: false
      },
      {
        id: 'banksManagement',
        title: 'MENU.FINANCE.BANK_MANAGEMENT',
        type: 'item',
        url: '/finance/banks',
        icon: 'account_balance',
        breadcrumbs: false
      },
      {
        id: 'oilCredit',
        title: 'MENU.FINANCE.OIL_CREDIT',
        type: 'item',
        url: '/finance/oil-credit',
        icon: 'credit_score',
        role: [Role.Admin],
        breadcrumbs: false
      },
      {
        id: 'customers',
        title: 'MENU.FINANCE.CUSTOMERS',
        type: 'item',
        url: '/finance/customers',
        icon: 'people',
        breadcrumbs: false
      },
      {
        id: 'oilSales',
        title: 'MENU.FINANCE.OIL_SALES',
        type: 'item',
        url: '/finance/oil-sales',
        icon: 'sell',
        breadcrumbs: false
      },
      {
        id: 'wasteManagement',
        title: 'MENU.FINANCE.WASTE_MANAGEMENT',
        type: 'item',
        url: '/finance/waste',
        icon: 'cleaning_services',
        breadcrumbs: false
      }

    ]
  },

  // ────────────────────────
  // Stockage & Inventaire
  // ────────────────────────
  {
    id: 'storageGroup',
    title: 'MENU.STORAGE.TITLE',
    type: 'group',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'storageSettings',
        title: 'MENU.STORAGE.OIL_STORAGE_UNITS',
        type: 'item',
        url: '/storage',
        icon: 'inventory_2',
        breadcrumbs: false
      },
      {
        id: 'oilTransactionsStorage',
        title: 'MENU.FINANCE.OIL_TRANSACTIONS',
        type: 'item',
        url: '/storage/oil-transactions',
        icon: 'swap_horiz',
        role: [Role.Admin],
        breadcrumbs: false
      },
      {
        id: 'oilContainer',
        title: 'OIL_CONTAINER_MANAGEMENT',
        type: 'item',
        url: '/storage/oil-container',
        icon: 'home_repair_service',
        role: [Role.Admin],
        breadcrumbs: false
      }
    ]
  },

  // ────────────────────────
  // Ressources humaines
  // ────────────────────────
  // {
  //   id: 'hrGroup',
  //   title: 'MENU.HR.TITLE',
  //   type: 'group',
  //   role: [Role.Admin],
  //   children: [
  //     {
  //       id: 'employees',
  //       title: 'MENU.HR.EMPLOYEES',
  //       type: 'item',
  //       url: '/hr/employees',
  //       icon: 'badge',
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'rolesPermissions',
  //       title: 'MENU.HR.ROLES_PERMISSIONS',
  //       type: 'item',
  //       url: '/hr/roles',
  //       icon: 'admin_panel_settings',
  //       breadcrumbs: false
  //     }
  //   ]
  // },

  // ────────────────────────
  // Paramètres système
  // ────────────────────────
  {
    id: 'settingsGroup',
    title: 'MENU.SETTINGS.TITLE',
    type: 'group',
    role: [Role.Admin, Role.User,Role.OsmAdmin],
    children: [
      {
        id: 'settingsGroup',
        title: 'MENU.SETTINGS.TITLE',
        type: 'collapse',
        icon: 'settings',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'generalConfig',
            title: 'MENU.SETTINGS.GENERAL_CONFIG',
            type: 'item',
            url: '/settings/general-config',
            icon: 'tune',
            breadcrumbs: false
          },
          {
            id: 'genericTypesConfig',
            title: 'MENU.SETTINGS.APP_UI',
            type: 'item',
            url: '/settings/configuration',
            icon: 'build',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'genericTypes',
        title: 'Generic Types',
        type: 'item',
        url: '/settings/generic',
        icon: 'category',
        breadcrumbs: false
      },
      {
        id: 'qualityControlRules',
        title: 'Quality Control Rules',
        type: 'item',
        url: '/settings/quality-control',
        icon: 'rule',
        breadcrumbs: false
      },
      {
        id: 'machineStatus',
        title: 'MENU.SETTINGS.MILLING_MACHINES',
        type: 'item',
        url: '/reception/mill-machines',
        icon: 'precision_manufacturing',
        breadcrumbs: false
      },
      {
        id: 'users',
        title: 'MENU.SETTINGS.USERS',
        type: 'item',
        url: '/settings/users',
        icon: 'manage_accounts',
        breadcrumbs: false
      },
      {
        id: 'roles',
        title: 'MENU.SETTINGS.ROLES',
        type: 'item',
        url: '/settings/roles',
        icon: 'security',
        breadcrumbs: false
      }
    ]
  },

  // // ────────────────────────
  // // Reports (stand-alone)
  // // ────────────────────────
  // {
  //   id: 'reportsGroup',
  //   title: 'Reports',
  //   type: 'group',
  //   role: [Role.Admin, Role.User],
  //   children: [
  //     {
  //       id: 'productionReports',
  //       title: 'Production Reports',
  //       type: 'item',
  //       url: '/reports/production',
  //       icon: 'factory',
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'deliveryReports',
  //       title: 'Delivery Reports',
  //       type: 'item',
  //       url: '/reports/deliveries',
  //       icon: 'local_shipping',
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'financeReports',
  //       title: 'Finance Reports',
  //       type: 'item',
  //       url: '/reports/finance',
  //       icon: 'account_balance', // Kept: Matches "Finance"
  //     },
  //     {
  //       id: 'storageReports',
  //       title: 'Storage Reports',
  //       type: 'item',
  //       url: '/reports/storage',
  //       icon: 'warehouse', // Changed: Matches "Storage"
  //     },
  //     {
  //       id: 'hrReports',
  //       title: 'HR Reports',
  //       type: 'item',
  //       url: '/reports/hr',
  //       icon: 'people', // Kept: Matches "HR"
  //     }
  //   ]
  // },


];
