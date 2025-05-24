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
    children: [
      {
        id: 'Dashboard',
        title: 'Dashboard',
        type: 'collapse',
        icon: 'dashboard', // Kept: Suitable for "Dashboard"
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'default',
            title: 'Default',
            type: 'item',
            url: '/dashboard',
            icon: 'dashboard', // Added: Matches the parent "Dashboard"
            breadcrumbs: false
          },
          {
            id: 'analytics',
            title: 'Analytics',
            type: 'item',
            url: '/dashboard/analytics',
            icon: 'analytics', // Added: Reflects data analysis
            role: [Role.Admin]
          },
          {
            id: 'finance',
            title: 'Finance',
            type: 'item',
            url: '/dashboard/finance',
            icon: 'account_balance_wallet', // Added: Represents financial data
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
    icon: 'local_shipping', // Kept: Perfect for "Reception" (delivery/receiving)
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'oliveReception',
        title: 'Réception Olive',
        type: 'item',
        url: '/reception/reception-olive',
        icon: 'grass', // Changed: Represents olives (plant-based)
      },
      {
        id: 'oilReception',
        title: 'Réception d’huile',
        type: 'item',
        url: '/reception/reception-huile',
        icon: 'opacity', // Changed: Represents oil (liquid drop)
      },
      {
        id: 'qualityControlReception',
        title: 'Contrôle Qualité',
        type: 'item',
        url: '/reception/quality',
        icon: 'check_circle', // Changed: Represents quality assurance
      },
      {
        id: 'receptionFournisseurs',
        title: 'Fournisseurs',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'person', // Kept: Suitable for "Suppliers"
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
    icon: 'factory', // Kept: Perfect for "Production"
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'millingSchedule',
        title: 'Milling Schedules',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'schedule', // Added: Represents scheduling
        breadcrumbs:false
      },
      {
        id: 'machineStatus',
        title: 'Milling Machine',
        type: 'item',
        url: '/reception/mill-machines',
        icon: 'precision_manufacturing', // Added: Represents machinery
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
    icon: 'account_balance', // Kept: Suitable for "Finance"
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'Expenses',
        title: 'Depenses',
        type: 'item',
        url: '/finance/expenses',
        icon: 'money_off', // Kept: Good for "Expenses"
      },
      {
        id: 'banksManagement',
        title: 'Banks Management',
        type: 'item',
        url: '/finance/banks',
        icon: 'account_balance', // Kept: Matches the group icon for consistency
      },
      {
        id: 'oilCredit',
        title: 'Oil Credit',
        type: 'item',
        url: '/finance/oil-credit',
        icon: 'credit_card', // Changed: Better represents "Credit"
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
    icon: 'warehouse', // Changed: More specific than "inventory" for "Storage"
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'storageSettings',
        title: 'Storage & Oil Units',
        type: 'item',
        url: '/settings/storage',
        icon: 'inventory_2', // Changed: Represents inventory/storage units
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
    icon: 'groups', // Kept: Good for "Human Resources"
    role: [Role.Admin],
    children: [
      {
        id: 'employees',
        title: 'Employees',
        type: 'item',
        url: '/hr/employees',
        icon: 'people', // Kept: Suitable for "Employees"
      },
      {
        id: 'rolesPermissions',
        title: 'Roles & Permissions',
        type: 'item',
        url: '/hr/roles',
        icon: 'admin_panel_settings', // Changed: Better represents roles/permissions
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
    icon: 'settings', // Kept: Perfect for "Settings"
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'settingsGroup',
        title: 'Settings',
        type: 'collapse',
        icon: 'settings', // Kept: Matches the group
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'generalConfig',
            title: 'General Configuration',
            type: 'item',
            url: '/settings/general-config',
            icon: 'tune', // Changed: Represents general configuration
          },
          {
            id: 'genericTypes',
            title: 'Application Configuration',
            type: 'item',
            url: '/settings/configuration',
            icon: 'build', // Kept: Suitable for app configuration
          }
        ]
      },
      {
        id: 'qualityControlRules',
        title: 'Quality Control Rules',
        type: 'item',
        url: '/settings/quality-control',
        icon: 'rule', // Changed: Represents rules/checks
      },
      {
        id: 'genericTypes',
        title: 'Generic Types',
        type: 'item',
        url: '/settings/generic',
        icon: 'category'
      },
      {
        id: 'users',
        title: 'Gestion des utilisateurs',
        type: 'item',
        url: '/settings/users',
        icon: 'layers'
      },
      {
        id: 'roles',
        title: 'Gestion des roles',
        type: 'item',
        url: '/settings/roles',
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
    icon: 'assessment', // Changed: More specific for "Reports"
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'productionReports',
        title: 'Production Reports',
        type: 'item',
        url: '/reports/production',
        icon: 'factory', // Kept: Matches "Production"
      },
      {
        id: 'deliveryReports',
        title: 'Delivery Reports',
        type: 'item',
        url: '/reports/deliveries',
        icon: 'local_shipping', // Kept: Matches "Delivery"
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
