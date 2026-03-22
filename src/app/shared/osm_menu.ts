import {Navigation} from 'src/app/theme/types/navigation';
// CHANGE: permissions - use enums
import {
  Action,
  FinanceEntity,
  HabilitationEntity,
  OSMModule,
  permissionKey,
  ProductionEntity,
  ReceptionEntity
} from 'src/app/theme/types/permissions';


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
    type: 'group', // icon: 'dashboard',
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
        breadcrumbs: false, // CHANGE: permissions - require FINANCE:FINANCIALTRANSACTION:READ
        permissions: [permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)]
      },
      {
        id: 'item-dashboard-reception-overview',
        title: 'MENU.HOME.DASHBOARD.RECEPTION',
        type: 'item',
        url: '/reception',
        icon: 'assignment',
        breadcrumbs: false, // CHANGE: permissions - require RECEPTION:UNIFIEDDELIVERY:READ
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)]
      },
      {
        id: 'item-storage-storage_recap',
        title: 'MENU.HOME.DASHBOARD.STORAGE_RECAP',
        type: 'item',
        url: '/storage/storage_recap',
        icon: 'water_drop',

        breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        permissions: [permissionKey(OSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)]
      }
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
    modulePermission: 'RECEPTION', // group-level gate
    children: [
      // Submenu for Olive receptions (by operation type)
      {
        id: 'collapse-reception-olive',
        title: 'MENU.RECEPTION.OLIVE',
        type: 'collapse',
        icon: 'shopping_basket',
        // keep same permission style you used before
        ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY,
        children: [
          {
            id: 'item-reception-olive-exchange',
            title: 'OPERATION_TYPE.EXCHANGE',
            type: 'item',
            url: '/reception/reception-olive/exchange',
            icon: 'swap_horiz',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-olive-simple',
            title: 'OPERATION_TYPE.SIMPLE_RECEPTION',
            type: 'item',
            url: '/reception/reception-olive/simple_reception',
            icon: 'inventory_2',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-olive-base',
            title: 'OPERATION_TYPE.BASE',
            type: 'item',
            url: '/reception/reception-olive/base',
            icon: 'category',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-olive-purchase',
            title: 'OPERATION_TYPE.OLIVE_PURCHASE',
            type: 'item',
            url: '/reception/reception-olive/olive_purchase',
            icon: 'shopping_cart',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          }
        ]
      },

      // Keep Oil reception as a separate item
      {
        id: 'item-reception-oil',
        title: 'MENU.RECEPTION.OIL',
        type: 'item',
        url: '/reception/reception-huile',
        icon: 'local_shipping',
        breadcrumbs: false,
        ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
      }
    ]
  },
  {
    id: 'group-reception',
    title: 'OSM_DASHBOARD.ACTIONS.QUALITYCONTROLRESULT',
    type: 'group', // CHANGE: permissions - group requires RECEPTION:UNIFIEDDELIVERY:READ
    modulePermission: 'RECEPTION',
    children: [
      {
        id: 'item-reception-quality',
        title: 'MENU.RECEPTION.QUALITY_CONTROL_HUILE',
        type: 'item',
        url: '/reception/oil_qc',
        icon: 'rule',
        breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:QUALITYCONTROLRESULT:READ
        ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
      },
      {
        id: 'item-reception-quality',
        title: 'MENU.RECEPTION.QUALITY_CONTROL_OLIVE',
        type: 'item',
        url: '/reception/olive_qc',
        icon: 'rule',
        breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:QUALITYCONTROLRESULT:READ
        ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
      }
    ]
  },

  // =========================
  // PRODUCTION (≤3 items → keep flat)
  // =========================
  {
    id: 'group-production',
    title: 'MENU.PRODUCTION.TITLE',
    type: 'group', // CHANGE: permissions - group requires PRODUCTION permissions
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'item-production-mill-schedules',
        title: 'MENU.PRODUCTION.MILLING_SCHEDULE',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'schedule',
        breadcrumbs: false, // CHANGE: permissions - require RECEPTION:UNIFIEDDELIVERY:PLANNING
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)]
      },
      {
        id: 'group-reception',
        title: 'MENU.PRODUCTION.RECEPTIONS',
        type: 'collapse',
        icon: 'list_alt',
        children: [
          {
            id: 'reception-olive',
            title: 'Réception Olive',
            type: 'collapse',
            icon: 'spa',
            children: [
              {
                id: 'reception-olive-simple',
                title: 'Trituration Particulier',
                type: 'item',
                url: '/reception/reception-list/olive/SIMPLE_RECEPTION',
                icon: 'person',
                breadcrumbs: false
              },
              {
                id: 'reception-olive-base',
                title: 'Trituration sur Base',
                type: 'item',
                url: '/reception/reception-list/olive/BASE',
                icon: 'recycling',
                breadcrumbs: false
              },
              {
                id: 'reception-olive-purchase',
                title: 'Achat Olive',
                type: 'item',
                url: '/reception/reception-list/olive/OLIVE_PURCHASE',
                icon: 'shopping_basket',
                breadcrumbs: false
              },
              {
                id: 'reception-olive-exchange',
                title: 'Échange',
                type: 'item',
                url: '/reception/reception-list/olive/EXCHANGE',
                icon: 'compare_arrows',
                breadcrumbs: false
              }
            ]
          },
          {
            id: 'reception-huile',
            title: 'Réception Huile',
            type: 'item',
            url: '/reception/reception-list/oil',
            icon: 'water_drop',
            breadcrumbs: false
          }
        ]
      },

      {
        id: 'item-reception-supplier-manage',
        title: 'MENU.RECEPTION.AGRICULTURE',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'contact_page',
        breadcrumbs: false, // CHANGE: permissions - require RECEPTION:SUPPLIER:READ
        ressourcePermission: ReceptionEntity.SUPPLIER
      }

    ]
  },


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
            breadcrumbs: false, // CHANGE: permissions - require FINANCE:EXPENSE:READ
            ressourcePermission: FinanceEntity.EXPENSE
          },
          {
            id: 'item-finance-transactions',
            title: 'MENU.FINANCE.TRANSACTIONS',
            type: 'item',
            url: '/finance/transactions',
            icon: 'sync_alt',
            breadcrumbs: false, // CHANGE: permissions - require FINANCE:FINANCIALTRANSACTION:READ
            ressourcePermission: FinanceEntity.FINANCIALTRANSACTION
          },
          {
            id: 'item-finance-banks',
            title: 'MENU.FINANCE.BANK_MANAGEMENT',
            type: 'item',
            url: '/finance/banks',
            icon: 'account_balance',
            breadcrumbs: false, // CHANGE: permissions - require FINANCE:BANKACCOUNT:READ

            ressourcePermission: FinanceEntity.BANKACCOUNT
          },
          {
            id: 'item-finance-oil-credit',
            title: 'MENU.FINANCE.OIL_CREDIT',
            type: 'item',
            url: '/finance/oil-credit',
            icon: 'credit_score',
            breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:OILCREDIT:READ
            ressourcePermission: ProductionEntity.OILCREDIT
          },

          {
            id: 'item-finance-oil-sales',
            title: 'MENU.FINANCE.OIL_SALES',
            type: 'item',
            url: '/finance/oil-sales',
            icon: 'sell',
            breadcrumbs: false, // CHANGE: permissions - require FINANCE:OILSALE:READ
            ressourcePermission: FinanceEntity.OILSALE
          },
          {
            id: 'item-finance-waste-sales',
            title: 'MENU.FINANCE.WASTE_MANAGEMENT',
            type: 'item',
            url: '/finance/waste-sales',
            icon: 'recycling',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.WASTESALE
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
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'item-storage-units',
        title: 'MENU.STORAGE.OIL_STORAGE_UNITS',
        type: 'item',
        url: '/storage',
        icon: 'warehouse',
        breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
         ressourcePermission:    ProductionEntity.STORAGEUNIT

      },
      {
        id: 'item-storage-oil-transactions',
        title: 'MENU.FINANCE.OIL_TRANSACTIONS',
        type: 'item',
        url: '/storage/oil-transactions',
        icon: 'water_drop',

        breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:OILTRANSACTION:READ
        ressourcePermission:    ProductionEntity.OILTRANSACTION
      },
      {
        id: 'item-storage-containers',
        title: 'OIL_CONTAINER_MANAGEMENT',
        type: 'item',
        url: '/storage/oil-container',
        icon: 'inbox',

        breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        ressourcePermission:  ProductionEntity.STORAGEUNIT
      }
    ]
  },
  {
    id: 'group-conditionnement',
    title: 'CONDITIONNEMENT',
    type: 'group',
    children: [
      {
        id: 'item-production-of',
        title: 'Ordres de conditionnement',
        type: 'item',
        url: '/of',
        icon: 'factory',
        breadcrumbs: false,
      }
    ]
  },
  {
    id: 'group-stocks',
    title: 'STOCKS',
    type: 'group',
    children: [
      {
        id: 'item-stocks-dashboard',
        title: 'Dashboard Stock',
        type: 'item',
        url: '/stock/dashboard',
        icon: 'dashboard',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-audit',
        title: 'Audit',
        type: 'item',
        url: '/stock/audit',
        icon: 'history',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-articles',
        title: 'Articles',
        type: 'item',
        url: '/stock/articles',
        icon: 'inventory_2',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-fournisseurs',
        title: 'Fournisseurs',
        type: 'item',
        url: '/stock/fournisseurs',
        icon: 'local_shipping',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-clients',
        title: 'Clients',
        type: 'item',
        url: '/stock/clients',
        icon: 'people',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-skus',
        title: 'SKUs',
        type: 'item',
        url: '/stock/skus',
        icon: 'inventory',
        breadcrumbs: false
      },

      {
        id: 'item-stocks-bom',
        title: 'Nomenclatures',
        type: 'item',
        url: '/stock/boms',
        icon: 'receipt',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-lignes',
        title: 'Lignes de conditionnement',
        type: 'item',
        url: '/stock/lignes',
        icon: 'oil_barrel',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-emplacements',
        title: 'Emplacements',
        type: 'item',
        url: '/stock/emplacements',
        icon: 'warehouse',
        breadcrumbs: false
      },


     /* {
        id: 'item-stocks-bc',
        title: 'Bons de commande',
        type: 'item',
        url: '/stock/bons-commande',
        icon: 'receipt_long',
        breadcrumbs: false
      },
      {
        id: 'item-stocks-mouvements',
        title: 'Mouvements',
        type: 'item',
        url: '/stock/mouvements',
        icon: 'swap_horiz',
        breadcrumbs: false
      }*/
    ]
  },

  // =========================
  // SETTINGS (>3 items → wrapped)
  // =========================
  {
    id: 'group-settings',
    title: 'MENU.SETTINGS.TITLE',
    type: 'group',
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
            breadcrumbs: false,
            ressourcePermission:HabilitationEntity.COMPANYPROFILE
          },
          {
            id: 'item-settings-configuration',
            title: 'MENU.SETTINGS.APP_UI',
            type: 'item',
            url: '/settings/configuration',
            icon: 'widgets',
            breadcrumbs: false,
            ressourcePermission:HabilitationEntity.COMPANYPROFILE

          },
          {
            id: 'item-settings-generic',
            title: 'MENU.SETTINGS.GENERIC_TYPES',
            type: 'item',
            url: '/settings/generic',
            icon: 'category',
            breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:base_type:READ
            ressourcePermission:ProductionEntity.base_type
          },
          {
            id: 'item-settings-quality-rules',
            title: 'MENU.SETTINGS.QUALITY_CONTROL_RULES',
            type: 'item',
            url: '/settings/quality-control',
            icon: 'rule',
            breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:QUALITYCONTROLRULE:READ
            ressourcePermission:   ProductionEntity.QUALITYCONTROLRULE
          },
          {
            id: 'item-settings-mill-machines',
            title: 'MENU.SETTINGS.MILLING_MACHINES',
            type: 'item',
            url: '/reception/mill-machines',
            icon: 'precision_manufacturing',
            breadcrumbs: false, // CHANGE: permissions - require PRODUCTION:MILLMACHINE:READ
            ressourcePermission:  ProductionEntity.MILLMACHINE

          },
          {
            id: 'item-settings-users',
            title: 'MENU.SETTINGS.USERS',
            type: 'item',
            url: '/settings/users',
            icon: 'people',
            breadcrumbs: false, // CHANGE: permissions - require HABILITATION:OSMUSER:READ
            ressourcePermission:  HabilitationEntity.OSMUSER
          },
          {
            id: 'item-settings-roles',
            title: 'MENU.SETTINGS.ROLES',
            type: 'item',
            url: '/settings/roles',
            icon: 'admin_panel_settings',
            breadcrumbs: false, // CHANGE: permissions - require HABILITATION:ROLE:READ
            ressourcePermission:  HabilitationEntity.ROLE
          }
        ]
      }
    ]
  }

  // =========================
  // (Optional future sections; keep commented if not used)
  // =========================
  // {
  //   id: 'group-settings',
  //   title: 'MENU.HR.TITLE',
  //   type: 'group',
  //   modulePermission: 'HR',
  //   children: [
  //     {
  //       id: 'item-settings-roles',
  //       title: 'MENU.HR.EMPLOYEES',
  //       type: 'item',
  //       url: '/hr/employee',
  //       icon: 'admin_panel_settings',
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'item-settings-departments',
  //       title: 'departments',
  //       type: 'item',
  //       url: '/hr/department',
  //       icon: 'business',
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'item-settings-poste',
  //       title: 'postes',
  //       type: 'item',
  //       url: '/hr/poste',
  //       icon: 'work',
  //       breadcrumbs: false
  //     }
  //
  //   ]
  // }
];
