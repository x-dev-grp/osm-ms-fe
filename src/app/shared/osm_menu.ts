import { Navigation } from 'src/app/theme/types/navigation';

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
    id: 'Dashboard',
    title: 'MENU.HOME.DASHBOARD.TITLE',
    type: 'group',
    children: [
      {
        id: 'item-dashboard-finance',
        title: 'MENU.HOME.DASHBOARD.FINANCE',
        type: 'item',
        url: '/finance/dashboard',
        icon: 'show_chart',
        breadcrumbs: false,
        permissions: [permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)]
      },
      {
        id: 'item-dashboard-reception-overview',
        title: 'MENU.HOME.DASHBOARD.RECEPTION',
        type: 'item',
        url: '/reception',
        icon: 'assignment',
        breadcrumbs: false,
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)]
      },
      {
        id: 'item-dashboard-stocks',
        title: 'Stocks',
        type: 'item',
        url: '/stock/dashboard',
        icon: 'analytics',
        breadcrumbs: false
      },
      {
        id: 'collapse-analytics-reports',
        title: 'Rapports',
        type: 'collapse',
        icon: 'insights',
        children: [
          {
            id: 'item-analytics-dashboard',
            title: 'Vue Globale (OF)',
            type: 'item',
            url: '/analytics/dashboard',
            icon: 'dashboard',
            breadcrumbs: false
          },
          {
            id: 'item-analytics-of-yield',
            title: 'Rendements des OF',
            type: 'item',
            url: '/analytics/of-yield',
            icon: 'speed',
            breadcrumbs: false
          },
          {
            id: 'item-analytics-quality',
            title: 'Qualité & Non-conformités',
            type: 'item',
            url: '/analytics/quality',
            icon: 'fact_check',
            breadcrumbs: false
          },
          {
            id: 'item-analytics-bom-gap',
            title: 'Écarts Nomenclatures (BOM)',
            type: 'item',
            url: '/analytics/bom-gap',
            icon: 'difference',
            breadcrumbs: false
          },
          {
            id: 'item-analytics-filtration',
            title: 'Efficacité Filtrage',
            type: 'item',
            url: '/analytics/filtration',
            icon: 'filter_alt',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'item-storage-storage_recap',
        title: 'Stockage Huile',
        type: 'item',
        url: '/storage/storage_recap',
        icon: 'water_drop',
        breadcrumbs: false,
        permissions: [permissionKey(OSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)]
      }
    ]
  },

  // ────────────────────────
  // Réception
  // ────────────────────────
  {
    id: 'group-reception',
    title: 'MENU.RECEPTION.TITLE',
    type: 'group',
    modulePermission: 'RECEPTION',
    children: [
      {
        id: 'collapse-reception-olive',
        title: 'MENU.RECEPTION.OLIVE',
        type: 'collapse',
        icon: 'shopping_basket',
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
            icon: 'person',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-olive-base',
            title: 'OPERATION_TYPE.BASE',
            type: 'item',
            url: '/reception/reception-olive/base',
            icon: 'recycling',
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
      {
        id: 'item-reception-oil',
        title: 'MENU.RECEPTION.OIL',
        type: 'item',
        url: '/reception/reception-huile',
        icon: 'local_shipping',
        breadcrumbs: false,
        ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
      },
      {
        id: 'collapse-reception-lists',
        title: 'MENU.PRODUCTION.RECEPTIONS',
        type: 'collapse',
        icon: 'list_alt',
        children: [
          {
            id: 'collapse-reception-list-olive',
            title: 'Réception Olive',
            type: 'collapse',
            icon: 'spa',
            children: [
              {
                id: 'item-reception-list-olive-simple',
                title: 'Trituration Particulier',
                type: 'item',
                url: '/reception/reception-list/olive/SIMPLE_RECEPTION',
                icon: 'person',
                breadcrumbs: false,
                ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
              },
              {
                id: 'item-reception-list-olive-base',
                title: 'Trituration sur Base',
                type: 'item',
                url: '/reception/reception-list/olive/BASE',
                icon: 'recycling',
                breadcrumbs: false,
                ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
              },
              {
                id: 'item-reception-list-olive-purchase',
                title: 'Achat Olive',
                type: 'item',
                url: '/reception/reception-list/olive/OLIVE_PURCHASE',
                icon: 'shopping_basket',
                breadcrumbs: false,
                ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
              },
              {
                id: 'item-reception-list-olive-exchange',
                title: 'Échange',
                type: 'item',
                url: '/reception/reception-list/olive/EXCHANGE',
                icon: 'compare_arrows',
                breadcrumbs: false,
                ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
              }
            ]
          },
          {
            id: 'item-reception-list-oil',
            title: 'Réception Huile',
            type: 'item',
            url: '/reception/reception-list/oil',
            icon: 'water_drop',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          }
        ]
      },
      {
        id: 'item-reception-supplier-manage',
        title: 'MENU.RECEPTION.AGRICULTURE',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'contact_page',
        breadcrumbs: false,
        ressourcePermission: ReceptionEntity.SUPPLIER
      },
      {
        id: 'item-reception-mill-schedules',
        title: 'Plannings Trituration',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'schedule',
        breadcrumbs: false,
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)]
      }
    ]
  },

  // ────────────────────────
  // Contrôle Qualité
  // ────────────────────────
  {
    id: 'group-quality-control',
    title: 'OSM_DASHBOARD.ACTIONS.QUALITYCONTROLRESULT',
    type: 'group',
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'item-quality-control-oil',
        title: 'MENU.RECEPTION.QUALITY_CONTROL_HUILE',
        type: 'item',
        url: '/reception/oil_qc',
        icon: 'rule',
        breadcrumbs: false,
        ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
      },
      {
        id: 'item-quality-control-olive',
        title: 'MENU.RECEPTION.QUALITY_CONTROL_OLIVE',
        type: 'item',
        url: '/reception/olive_qc',
        icon: 'rule',
        breadcrumbs: false,
        ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
      }
    ]
  },

  // ────────────────────────
  // Production
  // ────────────────────────
  {
    id: 'group-production',
    title: 'MENU.PRODUCTION.TITLE',
    type: 'group',
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'item-production-mill-schedules',
        title: 'MENU.PRODUCTION.MILLING_SCHEDULE',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'schedule',
        breadcrumbs: false,
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)]
      }
    ]
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

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PRODUCTION & STOCKAGE HUILERIE
  // ──────────────────────────────────────────────────────────────────────────
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
        breadcrumbs: false,
        ressourcePermission: ProductionEntity.STORAGEUNIT
      },
      {
        id: 'item-storage-oil-transactions',
        title: 'MENU.FINANCE.OIL_TRANSACTIONS',
        type: 'item',
        url: '/storage/oil-transactions',
        icon: 'water_drop',
        breadcrumbs: false,
        ressourcePermission: ProductionEntity.OILTRANSACTION
      },
      {
        id: 'item-storage-oil-filtering',
        title: 'Filtrage Huile',
        type: 'item',
        url: '/storage/oil-filtering',
        icon: 'filter_alt',
        breadcrumbs: false,
        ressourcePermission: ProductionEntity.STORAGEUNIT
      },
      {
        id: 'item-storage-containers',
        title: 'OIL_CONTAINER_MANAGEMENT',
        type: 'item',
        url: '/storage/oil-container',
        icon: 'inbox',
        breadcrumbs: false,
        ressourcePermission: ProductionEntity.STORAGEUNIT
      }
    ]
  },

  // ────────────────────────
  // Conditionnement & Ventes
  // ────────────────────────
  {
    id: 'group-conditioning-sales',
    title: 'Conditionnement & Ventes',
    type: 'group',
    children: [
      {
        id: 'item-stocks-audit',
        title: 'Journal d\'Audit',
        type: 'item',
        url: '/stock/audit',
        icon: 'history',
        breadcrumbs: false
      },
      {
        id: 'item-conditioning-projects',
        title: 'Projets Clients',
        type: 'collapse',
        icon: 'assignment',
        children: [
          {
            id: 'item-projet-list',
            title: 'Liste des projets',
            type: 'item',
            url: '/projets',
            icon: 'list_alt',
            breadcrumbs: false
          },
          {
            id: 'item-projet-expeditions',
            title: 'Expéditions',
            type: 'item',
            url: '/projets/expeditions',
            icon: 'route',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'item-conditioning-of',
        title: 'Ordres de Fab. (OF)',
        type: 'item',
        url: '/of',
        icon: 'factory',
        breadcrumbs: false
      },
      {
        id: 'item-conditioning-lines',
        title: 'Lignes de Conditionnement',
        type: 'item',
        url: '/stock/lignes',
        icon: 'precision_manufacturing',
        breadcrumbs: false
      },
      {
        id: 'item-conditioning-labels',
        title: 'Étiquettes & Labellisation',
        type: 'item',
        url: '/labels',
        icon: 'label',
        breadcrumbs: false
      },
      {
        id: 'item-expedition',
        title: 'Expéditions & Logistique',
        type: 'item',
        url: '/projets/expeditions',
        icon: 'local_shipping',
        breadcrumbs: false
      },
      {
        id: 'item-client-cond',
        title: 'Gestion Clients',
        type: 'item',
        url: '/projets/clients',
        icon: 'groups',
        breadcrumbs: false
      }
    ]
  },

  // ────────────────────────
  // Stocks & Inventaire
  // ────────────────────────
  {
    id: 'group-stocks-inventory',
    title: 'Stocks & Inventaire',
    type: 'group',
    children: [
      {
        id: 'collapse-stock-items',
        title: 'Articles & Produits-finis',
        type: 'collapse',
        icon: 'inventory_2',
        children: [
          {
            id: 'item-stocks-articles',
            title: 'Articles de cond.',
            type: 'item',
            url: '/stock/articles',
            icon: 'category',
            breadcrumbs: false
          },
          {
            id: 'item-stocks-skus',
            title: 'Produits finis',
            type: 'item',
            url: '/stock/skus',
            icon: 'barcode_scanner',
            breadcrumbs: false
          },
          {
            id: 'item-stocks-bom',
            title: 'Nomenclatures (BOM)',
            type: 'item',
            url: '/stock/boms',
            icon: 'receipt',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'collapse-stock-operations',
        title: 'Mouvements & Zones',
        type: 'collapse',
        icon: 'inventory',
        children: [
          {
            id: 'item-stocks-mouvements',
            title: 'Mouvements Stock',
            type: 'item',
            url: '/stock/mouvements',
            icon: 'swap_horiz',
            breadcrumbs: false
          },
          {
            id: 'item-stocks-emplacements',
            title: 'Emplacements',
            type: 'item',
            url: '/stock/emplacements',
            icon: 'grid_view',
            breadcrumbs: false
          },
          {
            id: 'item-stocks-par-emplacement',
            title: 'Stock par Zone',
            type: 'item',
            url: '/stock/par-emplacement',
            icon: 'view_list',
            breadcrumbs: false
          },
          {
            id: 'item-stocks-audit',
            title: "Journal d'Audit",
            type: 'item',
            url: '/stock/audit',
            icon: 'history',
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'collapse-stock-purchasing',
        title: 'Achats & Fournisseurs',
        type: 'collapse',
        icon: 'shopping_bag',
        children: [
          {
            id: 'item-stocks-bons-commande',
            title: 'Bons de Commande',
            type: 'item',
            url: '/stock/bons-commande',
            icon: 'description',
            breadcrumbs: false
          },
          {
            id: 'item-stocks-fournisseurs',
            title: 'Fournisseurs Mat.',
            type: 'item',
            url: '/stock/fournisseurs',
            icon: 'business',
            breadcrumbs: false
          }
        ]
      }
    ]
  },

  // ────────────────────────
  // Finance
  // ────────────────────────
  {
    id: 'group-finance',
    title: 'MENU.FINANCE.TITLE',
    type: 'group',
    modulePermission: 'FINANCE',
    children: [
      {
        id: 'collapse-group-finance-main',
        title: 'Gestion de Colis',
        type: 'collapse',
        icon: 'account_balance',
        children: [
          {
            id: 'item-finance-expenses',
            title: 'MENU.FINANCE.EXPENSES',
            type: 'item',
            url: '/finance/expenses',
            icon: 'receipt_long',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.EXPENSE
          },
          {
            id: 'item-finance-transactions',
            title: 'MENU.FINANCE.TRANSACTIONS',
            type: 'item',
            url: '/finance/transactions',
            icon: 'sync_alt',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.FINANCIALTRANSACTION
          },
          {
            id: 'item-finance-banks',
            title: 'MENU.FINANCE.BANK_MANAGEMENT',
            type: 'item',
            url: '/finance/banks',
            icon: 'account_balance',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.BANKACCOUNT
          }
        ]
      },
      {
        id: 'collapse-finance-sales',
        title: 'Ventes & Crédits',
        type: 'collapse',
        icon: 'sell',
        children: [
          {
            id: 'item-finance-oil-sales',
            title: 'MENU.FINANCE.OIL_SALES',
            type: 'item',
            url: '/finance/oil-sales',
            icon: 'point_of_sale',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.OILSALE
          },
          {
            id: 'item-finance-oil-credit',
            title: 'MENU.FINANCE.OIL_CREDIT',
            type: 'item',
            url: '/finance/oil-credit',
            icon: 'credit_score',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.OILCREDIT
          },
          {
            id: 'item-finance-waste-sales',
            title: 'MENU.FINANCE.WASTE_MANAGEMENT',
            type: 'item',
            url: '/finance/waste-sales',
            icon: 'delete_sweep',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.WASTESALE
          }
        ]
      }
    ]
  },

  // ────────────────────────
  // Paramètres
  // ────────────────────────
  {
    id: 'group-settings',
    title: 'MENU.SETTINGS.TITLE',
    type: 'group',
    children: [
      {
        id: 'collapse-settings-application',
        title: 'Config. Applicative',
        type: 'collapse',
        icon: 'settings',
        children: [
          {
            id: 'item-settings-general-config',
            title: 'MENU.SETTINGS.GENERAL_CONFIG',
            type: 'item',
            url: '/settings/general-config',
            icon: 'business',
            breadcrumbs: false,
            ressourcePermission: HabilitationEntity.COMPANYPROFILE
          },
          {
            id: 'item-settings-configuration',
            title: 'MENU.SETTINGS.APP_UI',
            type: 'item',
            url: '/settings/configuration',
            icon: 'dashboard_customize',
            breadcrumbs: false,
            ressourcePermission: HabilitationEntity.COMPANYPROFILE
          },
          {
            id: 'item-settings-generic',
            title: 'MENU.SETTINGS.GENERIC_TYPES',
            type: 'item',
            url: '/settings/generic',
            icon: 'list_alt',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.base_type
          },
          {
            id: 'item-settings-quality-rules',
            title: 'MENU.SETTINGS.QUALITY_CONTROL_RULES',
            type: 'item',
            url: '/settings/quality-control',
            icon: 'verified',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.QUALITYCONTROLRULE
          },
          {
            id: 'item-settings-certifications',
            title: 'Certifications',
            type: 'item',
            url: '/labels/certifications',
            icon: 'verified_user',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.CERTIFICATION
          },
          {
            id: 'item-settings-mill-machines',
            title: 'MENU.SETTINGS.MILLING_MACHINES',
            type: 'item',
            url: '/reception/mill-machines',
            icon: 'settings_input_component',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.MILLMACHINE
          }
        ]
      },
      {
        id: 'collapse-settings-security',
        title: 'Sécurité & Accès',
        type: 'collapse',
        icon: 'security',
        children: [
          {
            id: 'item-settings-users',
            title: 'MENU.SETTINGS.USERS',
            type: 'item',
            url: '/settings/users',
            icon: 'person_outline',
            breadcrumbs: false,
            ressourcePermission: HabilitationEntity.OSMUSER
          },
          {
            id: 'item-settings-roles',
            title: 'MENU.SETTINGS.ROLES',
            type: 'item',
            url: '/settings/roles',
            icon: 'admin_panel_settings',
            breadcrumbs: false,
            ressourcePermission: HabilitationEntity.ROLE
          }
        ]
      }
    ]
  }
];
