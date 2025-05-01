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
    icon: 'icon-navigation',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'Dashboard',
        title: 'Dashboard',
        type: 'collapse',
        icon: '#custom-status-up',
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
    icon: '#custom-factory',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'operations',
        title: 'Operations',
        type: 'collapse',
        icon: '#custom-layer',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'reception',
            title: 'Réception',
            type: 'item',
            url: '/reception/reception',
            icon: '#custom-document-text'
          },
          {
            id: 'qcrReception',
            title: 'Contrôle Qualité',
            type: 'item',
            url: '/reception/quality',
            icon: '#custom-password-check'
          },
          {
            id: 'fournisseurReception',
            title: 'Fournisseurs',
            type: 'item',
            url: '/reception/fournisseur',
            icon: '#custom-user'
          }
        ]
      },
      {
        id: 'deliveries',
        title: 'Deliveries',
        type: 'collapse',
        icon: '#custom-truck',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'receptionOrders',
            title: 'Réception d’huile',
            type: 'item',
            url: '/deliveries/reception-order',
            icon: '#custom-arrow-down-line'
          },
          {
            id: 'receiptOrders',
            title: 'Réception Base Oil',
            type: 'item',
            url: '/deliveries/receipt-order',
            icon: '#custom-document'
          },
          {
            id: 'baseOilOrders',
            title: 'Achat Base Oil',
            type: 'item',
            url: '/deliveries/base-oil',
            icon: '#custom-dollar-square'
          },
          {
            id: 'exchange',
            title: 'Échanges',
            type: 'item',
            url: '/deliveries/exchange',
            icon: '#custom-refresh-2'
          },
          {
            id: 'millingRequests',
            title: 'Milling Requests',
            type: 'item',
            url: '/deliveries/mill-requests',
            icon: '#custom-layer'
          }
        ]
      },
      {
        id: 'productionPlanning',
        title: 'Production Planning',
        type: 'collapse',
        icon: '#custom-factory',
        role: [Role.Admin],
        children: [
          {
            id: 'millingSchedule',
            title: 'Milling Schedules',
            type: 'item',
            url: '/planning/mill-schedules',
            icon: '#custom-calendar-1'
          },
          {
            id: 'machineStatus',
            title: 'Machine Status',
            type: 'item',
            url: '/planning/machine-status',
            icon: '#custom-notification-status'
          },
          {
            id: 'lotAllocation',
            title: 'Lot Allocation',
            type: 'item',
            url: '/planning/lot-allocation',
            icon: '#custom-layer'
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
    icon: '#custom-dollar-square',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'salesOrders',
        title: 'Sales Orders',
        type: 'item',
        url: '/finance/sales-orders',
        icon: '#custom-document'
      },
      {
        id: 'invoicesPayments',
        title: 'Invoices & Payments',
        type: 'item',
        url: '/finance/invoices',
        icon: '#custom-document-2'
      },
      {
        id: 'financialReports',
        title: 'Financial Reports',
        type: 'item',
        url: '/finance/reports',
        icon: '#custom-presentation-chart'
      },
      {
        id: 'pricingSettings',
        title: 'Pricing & Accounting',
        type: 'item',
        url: '/settings/pricing',
        icon: '#custom-dollar-square'
      },
      {
        id: 'banksManagement',
        title: 'Banks Management',
        type: 'item',
        url: '/settings/banks',
        icon: '#custom-dollar-square'
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
    icon: '#custom-box-1',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'storageSettings',
        title: 'Storage & Oil Units',
        type: 'item',
        url: '/settings/storage',
        icon: '#custom-box-1'
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
    icon: '#custom-user-bold',
    role: [Role.Admin],
    children: [
      {
        id: 'employees',
        title: 'Employees',
        type: 'item',
        url: '/hr/employees',
        icon: '#custom-user'
      },
      {
        id: 'rolesPermissions',
        title: 'Roles & Permissions',
        type: 'item',
        url: '/hr/roles',
        icon: '#custom-lock-outline'
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
    icon: '#custom-setting-2',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'generalConfig',
        title: 'General Configuration',
        type: 'item',
        url: '/settings/general-config',
        icon: '#custom-setting-2'
      },
      {
        id: 'qualityControlRules',
        title: 'Quality Control Rules',
        type: 'item',
        url: '/settings/quality-control',
        icon: '#custom-password-check'
      },
      {
        id: 'genericTypes',
        title: 'Generic Types',
        type: 'item',
        url: '/settings/generic',
        icon: '#custom-layer'
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
    icon: '#custom-report',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'productionReports',
        title: 'Production Reports',
        type: 'item',
        url: '/reports/production',
        icon: '#custom-factory'
      },
      {
        id: 'deliveryReports',
        title: 'Delivery Reports',
        type: 'item',
        url: '/reports/deliveries',
        icon: '#custom-truck'
      },
      {
        id: 'financeReports',
        title: 'Finance Reports',
        type: 'item',
        url: '/reports/finance',
        icon: '#custom-presentation-chart'
      },
      {
        id: 'storageReports',
        title: 'Storage Reports',
        type: 'item',
        url: '/reports/storage',
        icon: '#custom-box-1'
      },
      {
        id: 'hrReports',
        title: 'HR Reports',
        type: 'item',
        url: '/reports/hr',
        icon: '#custom-user'
      }
    ]
  }
];
