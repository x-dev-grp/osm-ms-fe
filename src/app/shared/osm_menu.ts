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
    icon: 'home', // Kept: Represents the "Home" group well
    role: [Role.Admin, Role.User],
    modulePermission:'RECEPTION',
    children: [
      {
        id: 'Dashboard',
        title: 'Dashboard',
        type: 'collapse',
        icon: 'dashboard', // Kept: Suitable for "Dashboard"
        role: [Role.Admin, Role.User],
        ressourcePermission: 'RECEPTION',
        children: [
          {
            id: 'default',
            title: 'Default',
            type: 'item',
            url: '/dashboard',
            icon: 'space_dashboard',
            breadcrumbs: false,
            permissions: ['RECEPTION:RECEPTION:DELETE'],
          },
          {
            id: 'analytics',
            title: 'Analytics',
            type: 'item',
            url: '/dashboard/analytics',
            icon: 'insights',
            role: [Role.Admin]
          },
          {
            id: 'finance',
            title: 'Finance',
            type: 'item',
            url: '/dashboard/finance',
            icon: 'account_balance_wallet',
            role: [Role.Admin]
          }
        ]
      }
    ]
  },

  // ────────────────────────
  // Reception
  // ────────────────────────
  {
    id: 'receptionGroup',
    title: 'Reception',
    type: 'group',
    icon: 'local_shipping',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'oliveReception',
        title: 'Réception Olive',
        type: 'item',
        url: '/reception/reception-olive',
        icon: 'eco',
        breadcrumbs: false
      },
      {
        id: 'oilReception',
        title: 'Réception d’huile',
        type: 'item',
        url: '/reception/reception-huile',
        icon: 'water_drop',
        breadcrumbs: false
      },
      {
        id: 'qualityControlReception',
        title: 'Contrôle Qualité',
        type: 'item',
        url: '/reception/quality',
        icon: 'verified',
        breadcrumbs: false
      },
      {
        id: 'receptionFournisseurs',
        title: 'Fournisseurs',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'business',
        breadcrumbs: false
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
        id: 'millingSchedule',
        title: 'Milling Schedules',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'calendar_month',
        breadcrumbs: false
      },
      {
        id: 'machineStatus',
        title: 'Milling Machine',
        type: 'item',
        url: '/reception/mill-machines',
        icon: 'precision_manufacturing',
        breadcrumbs: false
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
        icon: 'payments',
        breadcrumbs: false
      },
      {
        id: 'banksManagement',
        title: 'Banks Management',
        type: 'item',
        url: '/finance/banks',
        icon: 'account_balance',
        breadcrumbs: false
      },
      {
        id: 'oilCredit',
        title: 'Oil Credit',
        type: 'item',
        url: '/finance/oil-credit',
        icon: 'credit_score',
        role: [Role.Admin],
        breadcrumbs: false
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
    icon: 'warehouse',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'storageSettings',
        title: 'Storage & Oil Units',
        type: 'item',
        url: '/settings/storage',
        icon: 'inventory_2',
        breadcrumbs: false
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
        icon: 'badge',
        breadcrumbs: false
      },
      {
        id: 'rolesPermissions',
        title: 'Roles & Permissions',
        type: 'item',
        url: '/hr/roles',
        icon: 'admin_panel_settings',
        breadcrumbs: false
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
            icon: 'tune',
            breadcrumbs: false
          },
          {
            id: 'genericTypes',
            title: 'Application Configuration',
            type: 'item',
            url: '/settings/configuration',
            icon: 'build',
            breadcrumbs: false
          }
        ]
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
        id: 'genericTypes',
        title: 'Generic Types',
        type: 'item',
        url: '/settings/generic',
        icon: 'category',
        breadcrumbs: false
      },
      {
        id: 'users',
        title: 'Gestion des utilisateurs',
        type: 'item',
        url: '/settings/users',
        icon: 'manage_accounts',
        breadcrumbs: false
      },
      {
        id: 'roles',
        title: 'Gestion des roles',
        type: 'item',
        url: '/settings/roles',
        icon: 'security',
        breadcrumbs: false
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
    icon: 'assessment',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'productionReports',
        title: 'Production Reports',
        type: 'item',
        url: '/reports/production',
        icon: 'factory',
        breadcrumbs: false
      },
      {
        id: 'deliveryReports',
        title: 'Delivery Reports',
        type: 'item',
        url: '/reports/deliveries',
        icon: 'local_shipping',
        breadcrumbs: false
      },
      {
        id: 'financeReports',
        title: 'Finance Reports',
        type: 'item',
        url: '/reports/finance',
        icon: 'account_balance', // Kept: Matches "Finance"
      },
      {
        id: 'storageReports',
        title: 'Storage Reports',
        type: 'item',
        url: '/reports/storage',
        icon: 'warehouse', // Changed: Matches "Storage"
      },
      {
        id: 'hrReports',
        title: 'HR Reports',
        type: 'item',
        url: '/reports/hr',
        icon: 'people', // Kept: Matches "HR"
      }
    ]
  }
];
