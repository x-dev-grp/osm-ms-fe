import { Navigation } from 'src/app/@theme/types/navigation';
import { Role } from 'src/app/@theme/types/role';

export const osm_menus: Navigation[] = [
  // ────────────────────────
  // Home / Dashboard
  // ────────────────────────
  {
    id: 'navigation',
    title: 'Home',
    type: 'group',
    icon: 'home',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'Dashboard',
        title: 'Dashboard',
        type: 'collapse',
        icon: 'dashboard',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'default',
            title: 'Default',
            type: 'item',
            url: '/dashboard',
            breadcrumbs: false
          },
          {
            id: 'analytics',
            title: 'Analytics',
            type: 'item',
            url: '/dashboard/analytics',
            role: [Role.Admin]
          },
          {
            id: 'finance',
            title: 'Finance',
            type: 'item',
            url: '/dashboard/finance',
            role: [Role.Admin]
          }
        ]
      }
    ]
  },

  // ────────────────────────
  // Production Operations
  // ────────────────────────
  {
    id: 'productionGroup',
    title: 'Production',
    type: 'group',
    icon: 'factory',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'operations',
        title: 'Operations',
        type: 'collapse',
        icon: 'layers',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'reception',
            title: 'Réception',
            type: 'item',
            url: '/reception/reception',
            icon: 'description'
          },
          {
            id: 'qcrReception',
            title: 'Contrôle Qualité',
            type: 'item',
            url: '/reception/quality',
            icon: 'fact_check'
          },
          {
            id: 'fournisseurReception',
            title: 'Fournisseurs',
            type: 'item',
            url: '/reception/fournisseur',
            icon: 'person'
          }
        ]
      },
      {
        id: 'deliveries',
        title: 'Deliveries',
        type: 'collapse',
        icon: 'local_shipping',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'receptionOrders',
            title: 'Réception d’huile',
            type: 'item',
            url: '/deliveries/reception-order',
            icon: 'arrow_downward'
          },
          {
            id: 'receiptOrders',
            title: 'Réception Base Oil',
            type: 'item',
            url: '/deliveries/receipt-order',
            icon: 'description'
          },
          {
            id: 'baseOilOrders',
            title: 'Achat Base Oil',
            type: 'item',
            url: '/deliveries/base-oil',
            icon: 'attach_money'
          },
          {
            id: 'exchange',
            title: 'Échanges',
            type: 'item',
            url: '/deliveries/exchange',
            icon: 'autorenew'
          },
          {
            id: 'millingRequests',
            title: 'Milling Requests',
            type: 'item',
            url: '/deliveries/mill-requests',
            icon: 'layers'
          }
        ]
      },
      {
        id: 'productionPlanning',
        title: 'Production Planning',
        type: 'collapse',
        icon: 'factory',
        role: [Role.Admin],
        children: [
          {
            id: 'millingSchedule',
            title: 'Milling Schedules',
            type: 'item',
            url: '/reception/mill-schedules',
            icon: 'calendar_today'
          },
          {
            id: 'machineStatus',
            title: 'Machine Status',
            type: 'item',
            url: '/planning/machine-status',
            icon: 'monitoring'
          },
          {
            id: 'lotAllocation',
            title: 'Lot Allocation',
            type: 'item',
            url: '/reception/lot-allocation',
            icon: 'layers'
          }
        ]
      }
    ]
  },

  // ────────────────────────
  // Finance & Accounting
  // ────────────────────────
  {
    id: 'financeGroup',
    title: 'Finance',
    type: 'group',
    icon: 'account_balance',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'Expenses',
        title: 'Depenses',
        type: 'item',
        url: '/finance/expenses',
        icon: 'money_off'
      },
      {
        id: 'banksManagement',
        title: 'Banks Management',
        type: 'item',
        url: '/finance/banks',
        icon: 'account_balance'
      },
      {
        id: 'oilCredit',
        title: 'Oil Credit',
        type: 'item',
        url: '/finance/oil-credit',
        icon: 'credit_score',
        role: [Role.Admin]
      }
    ]
  },

  // ────────────────────────
  // Storage & Inventory
  // ────────────────────────
  {
    id: 'storageGroup',
    title: 'Storage',
    type: 'group',
    icon: 'inventory',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'storageSettings',
        title: 'Storage & Oil Units',
        type: 'item',
        url: '/settings/storage',
        icon: 'inventory'
      }
    ]
  },

  // ────────────────────────
  // Human Resources
  // ────────────────────────
  {
    id: 'hrGroup',
    title: 'HR',
    type: 'group',
    icon: 'groups',
    role: [Role.Admin],
    children: [
      {
        id: 'employees',
        title: 'Employees',
        type: 'item',
        url: '/hr/employees',
        icon: 'people'
      },
      {
        id: 'rolesPermissions',
        title: 'Roles & Permissions',
        type: 'item',
        url: '/hr/roles',
        icon: 'lock'
      }
    ]
  },

  // ────────────────────────
  // System Settings
  // ────────────────────────
  {
    id: 'settingsGroup',
    title: 'Settings',
    type: 'group',
    icon: 'settings',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'settingsGroup',
        title: 'Settings',
        type: 'collapse',
        icon: 'settings',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'generalConfig',
            title: 'General Configuration',
            type: 'item',
            url: '/settings/general-config',
            icon: 'settings'
          },{
            id: 'genericTypes',
            title: 'Application Configuration',
            type: 'item',
            url: '/settings/configuration',
            icon: 'build'
          },

        ]
      },
      {
        id: 'qualityControlRules',
        title: 'Quality Control Rules',
        type: 'item',
        url: '/settings/quality-control',
        icon: 'fact_check'
      },
      {
        id: 'genericTypes',
        title: 'Generic Types',
        type: 'item',
        url: '/settings/generic',
        icon: 'layers'
      }
    ]
  },

  // ────────────────────────
  // Reports (stand-alone)
  // ────────────────────────
  {
    id: 'reportsGroup',
    title: 'Reports',
    type: 'group',
    icon: 'bar_chart',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'productionReports',
        title: 'Production Reports',
        type: 'item',
        url: '/reports/production',
        icon: 'factory'
      },
      {
        id: 'deliveryReports',
        title: 'Delivery Reports',
        type: 'item',
        url: '/reports/deliveries',
        icon: 'local_shipping'
      },
      {
        id: 'financeReports',
        title: 'Finance Reports',
        type: 'item',
        url: '/reports/finance',
        icon: 'bar_chart'
      },
      {
        id: 'storageReports',
        title: 'Storage Reports',
        type: 'item',
        url: '/reports/storage',
        icon: 'inventory'
      },
      {
        id: 'hrReports',
        title: 'HR Reports',
        type: 'item',
        url: '/reports/hr',
        icon: 'people'
      }
    ]
  }
];
