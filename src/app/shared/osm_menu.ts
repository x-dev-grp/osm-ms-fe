import {Navigation} from 'src/app/theme/types/navigation';
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
    id: 'group-dashboards',
    title: 'Tableaux de Bord', // Literal as per "ignore translation" guidance
    type: 'group',
    icon: 'dashboard',
    children: [
      {
        id: 'item-dashboard-finance',
        title: 'Finance',
        type: 'item',
        url: '/finance/dashboard',
        icon: 'show_chart',
        permissions: [permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)]
      },
      {
        id: 'item-dashboard-reception-overview',
        title: 'Réceptions',
        type: 'item',
        url: '/reception',
        icon: 'assignment',
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)]
      },
      {
        id: 'item-stocks-dashboard',
        title: 'Stocks',
        type: 'item',
        url: '/stock/dashboard',
        icon: 'analytics'
      },
      {
        id: 'item-storage-storage_recap',
        title: 'Stockage Huile',
        type: 'item',
        url: '/storage/storage_recap',
        icon: 'water_drop',
        permissions: [permissionKey(OSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)]
      }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. RÉCEPTIONS & QUALITÉ
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'group-reception',
    title: 'Réceptions & Qualité',
    type: 'group',
    modulePermission: 'RECEPTION',
    children: [
      {
        id: 'collapse-reception-olive',
        title: 'Réception Olives',
        type: 'collapse',
        icon: 'spa',
        children: [
          {
            id: 'item-reception-olive-simple',
            title: 'Trituration Particulier',
            type: 'item',
            url: '/reception/reception-olive/simple_reception',
            icon: 'person'
          },
          {
            id: 'item-reception-olive-base',
            title: 'Trituration sur Base',
            type: 'item',
            url: '/reception/reception-olive/base',
            icon: 'recycling'
          },
          {
            id: 'item-reception-olive-purchase',
            title: 'Achat Olive',
            type: 'item',
            url: '/reception/reception-olive/olive_purchase',
            icon: 'shopping_cart'
          },
          {
            id: 'item-reception-olive-exchange',
            title: 'Échange',
            type: 'item',
            url: '/reception/reception-olive/exchange',
            icon: 'swap_horiz'
          }
        ]
      },
      {
        id: 'item-reception-oil',
        title: 'Réception Huile',
        type: 'item',
        url: '/reception/reception-huile',
        icon: 'local_shipping',
        ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
      },
      {
        id: 'collapse-quality',
        title: 'Contrôles Qualité',
        type: 'collapse',
        icon: 'fact_check',
        children: [
          {
            id: 'item-reception-quality-oil',
            title: 'Contrôle Huile',
            type: 'item',
            url: '/reception/oil_qc',
            icon: 'rule',
            ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
          },
          {
            id: 'item-reception-quality-olive',
            title: 'Contrôle Olive',
            type: 'item',
            url: '/reception/olive_qc',
            icon: 'rule',
            ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
          }
        ]
      },
      {
        id: 'item-production-mill-schedules',
        title: 'Plannings Trituration',
        type: 'item',
        url: '/reception/mill-schedules',
        icon: 'schedule',
        permissions: [permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)]
      }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PRODUCTION & STOCKAGE HUILERIE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'group-mill-production',
    title: 'Production & Huilerie',
    type: 'group',
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'item-storage-units',
        title: 'Unités de Stockage',
        type: 'item',
        url: '/storage',
        icon: 'warehouse',
        ressourcePermission: ProductionEntity.STORAGEUNIT
      },
      {
        id: 'item-storage-oil-transactions',
        title: 'Mouvements d\'huile',
        type: 'item',
        url: '/storage/oil-transactions',
        icon: 'water_drop',
        ressourcePermission: ProductionEntity.OILTRANSACTION
      },
      {
        id: 'item-storage-filtrage',
        title: 'Filtrage Huile',
        type: 'item',
        url: '/storage/oil-filtering',
        icon: 'filter_alt',
        ressourcePermission: ProductionEntity.STORAGEUNIT
      },
      {
        id: 'item-storage-containers',
        title: 'Conditionnement Vrac',
        type: 'item',
        url: '/storage/oil-container',
        icon: 'inbox',
        ressourcePermission: ProductionEntity.STORAGEUNIT
      },
      {
        id: 'item-reception-supplier-manage',
        title: 'Agriculteurs',
        type: 'item',
        url: '/reception/fournisseur',
        icon: 'contact_page',
        ressourcePermission: ReceptionEntity.SUPPLIER
      }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. CONDITIONNEMENT & LOGISTIQUE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'group-conditionnement',
    title: 'Conditionnement & Ventes',
    type: 'group',
    children: [
      {
        id: 'item-projet',
        title: 'Projets Clients',
        type: 'item',
        url: '/projets',
        icon: 'assignment'
      },
      {
        id: 'item-production-of',
        title: 'Ordres de Fab. (OF)',
        type: 'item',
        url: '/of',
        icon: 'factory'
      },
      {
        id: 'item-stocks-lignes',
        title: 'Lignes de Conditionnement',
        type: 'item',
        url: '/stock/lignes',
        icon: 'precision_manufacturing'
      },
      {
        id: 'item-production-labels',
        title: 'Étiquettes & Labellisation',
        type: 'item',
        url: '/labels',
        icon: 'label'
      },
      {
        id: 'item-expedition',
        title: 'Expéditions & Logistique',
        type: 'item',
        url: '/projets/expeditions',
        icon: 'local_shipping'
      },
      {
        id: 'item-client-cond',
        title: 'Gestion Clients',
        type: 'item',
        url: '/projets/clients',
        icon: 'groups'
      }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. GESTION DES STOCKS & ACHATS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'group-stocks-inventory',
    title: 'Stocks & Inventaire',
    type: 'group',
    children: [
      {
        id: 'collapse-stock-items',
        title: 'Articles & SKUs',
        type: 'collapse',
        icon: 'inventory_2',
        children: [
          {
            id: 'item-stocks-articles',
            title: 'Articles de cond.',
            type: 'item',
            url: '/stock/articles',
            icon: 'category'
          },
          {
            id: 'item-stocks-skus',
            title: 'Unités de Vente (SKU)',
            type: 'item',
            url: '/stock/skus',
            icon: 'barcode_scanner'
          },
          {
            id: 'item-stocks-bom',
            title: 'Nomenclatures (BOM)',
            type: 'item',
            url: '/stock/boms',
            icon: 'receipt'
          }
        ]
      },
      {
        id: 'collapse-stock-ops',
        title: 'Mouvements & Zones',
        type: 'collapse',
        icon: 'inventory',
        children: [
          {
            id: 'item-stocks-mouvements',
            title: 'Mouvements Stock',
            type: 'item',
            url: '/stock/mouvements',
            icon: 'swap_horiz'
          },
          {
            id: 'item-stocks-emplacements',
            title: 'Emplacements',
            type: 'item',
            url: '/stock/emplacements',
            icon: 'grid_view'
          },
          {
            id: 'item-stocks-par-emplacement',
            title: 'Stock par Zone',
            type: 'item',
            url: '/stock/par-emplacement',
            icon: 'view_list'
          },
          {
            id: 'item-stocks-audit',
            title: 'Journal d\'Audit',
            type: 'item',
            url: '/stock/audit',
            icon: 'history'
          }
        ]
      },
      {
        id: 'collapse-purchasing',
        title: 'Achats & Fournisseurs',
        type: 'collapse',
        icon: 'shopping_bag',
        children: [
          {
            id: 'item-stocks-bc',
            title: 'Bons de Commande',
            type: 'item',
            url: '/stock/bons-commande',
            icon: 'description'
          },
          {
            id: 'item-stocks-fournisseurs',
            title: 'Fournisseurs Mat.',
            type: 'item',
            url: '/stock/fournisseurs',
            icon: 'business'
          }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. FINANCE & COMPTABILITÉ
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'group-finance',
    title: 'Finance & Trésorerie',
    type: 'group',
    modulePermission: 'FINANCE',
    children: [
      {
        id: 'collapse-group-finance-main',
        title: 'Gestion de Caisse',
        type: 'collapse',
        icon: 'account_balance',
        children: [
          {
            id: 'item-finance-expenses',
            title: 'Dépenses',
            type: 'item',
            url: '/finance/expenses',
            icon: 'receipt_long',
            ressourcePermission: FinanceEntity.EXPENSE
          },
          {
            id: 'item-finance-transactions',
            title: 'Transactions',
            type: 'item',
            url: '/finance/transactions',
            icon: 'sync_alt',
            ressourcePermission: FinanceEntity.FINANCIALTRANSACTION
          },
          {
            id: 'item-finance-banks',
            title: 'Comptes Bancaires',
            type: 'item',
            url: '/finance/banks',
            icon: 'account_balance',
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
            title: 'Ventes Huile',
            type: 'item',
            url: '/finance/oil-sales',
            icon: 'point_of_sale',
            ressourcePermission: FinanceEntity.OILSALE
          },
          {
            id: 'item-finance-oil-credit',
            title: 'Crédits Huile',
            type: 'item',
            url: '/finance/oil-credit',
            icon: 'credit_score',
            ressourcePermission: ProductionEntity.OILCREDIT
          },
          {
            id: 'item-finance-waste-sales',
            title: 'Grignons & Déchets',
            type: 'item',
            url: '/finance/waste-sales',
            icon: 'delete_sweep',
            ressourcePermission: FinanceEntity.WASTESALE
          }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. PARAMÈTRES & CONFIGURATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'group-settings',
    title: 'Paramètres Système',
    type: 'group',
    children: [
      {
        id: 'collapse-group-settings-main',
        title: 'Config. Applicative',
        type: 'collapse',
        icon: 'settings',
        children: [
          {
            id: 'item-settings-general-config',
            title: 'Société',
            type: 'item',
            url: '/settings/general-config',
            icon: 'business',
            ressourcePermission:HabilitationEntity.COMPANYPROFILE
          },
          {
            id: 'item-settings-configuration',
            title: 'Apparence UI',
            type: 'item',
            url: '/settings/configuration',
            icon: 'dashboard_customize',
            ressourcePermission:HabilitationEntity.COMPANYPROFILE
          },
          {
            id: 'item-settings-generic',
            title: 'Types Génériques',
            type: 'item',
            url: '/settings/generic',
            icon: 'list_alt',
            ressourcePermission:ProductionEntity.base_type
          },
          {
            id: 'item-settings-quality-rules',
            title: 'Règles Qualité',
            type: 'item',
            url: '/settings/quality-control',
            icon: 'verified',
            ressourcePermission: ProductionEntity.QUALITYCONTROLRULE
          },
          {
            id: 'item-settings-mill-machines',
            title: 'Équipements Moulin',
            type: 'item',
            url: '/reception/mill-machines',
            icon: 'settings_input_component',
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
            title: 'Utilisateurs',
            type: 'item',
            url: '/settings/users',
            icon: 'person_outline',
            ressourcePermission: HabilitationEntity.OSMUSER
          },
          {
            id: 'item-settings-roles',
            title: 'Habilitations',
            type: 'item',
            url: '/settings/roles',
            icon: 'admin_panel_settings',
            ressourcePermission: HabilitationEntity.ROLE
          }
        ]
      }
    ]
  }
];
