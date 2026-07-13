import { Navigation } from 'src/app/theme/types/navigation';

import {
  Action,
  ConditioningEntity,
  FinanceEntity,
  HabilitationEntity,
  InventoryEntity,
  OOSMModule,
  permissionKey,
  ProductionEntity,
  ReceptionEntity,
  HREntity
} from 'src/app/theme/types/permissions';

/**
 * Menu organized by OOSM module and business logic.
 * Flow: Réception → Production huile → Conditionnement → Inventaire → Finance → Paramètres
 */
export const oosm_menus: Navigation[] = [
  {
    id: 'group-dashboard-hub',
    title: 'DASHBOARD_HUB.TITLE',
    type: 'group',
    children: [
      {
        id: 'item-dashboard-hub',
        title: 'DASHBOARD_HUB.TITLE',
        type: 'item',
        url: '/dashboard',
        icon: 'dashboard',
        breadcrumbs: false
      }
    ]
  },
  // ─── RÉCEPTION ─────────────────────────────────────────────────────────────
  {
    id: 'group-reception',
    title: 'MENU.RECEPTION.TITLE',
    type: 'group',
    modulePermission: 'RECEPTION',
    children: [
      {
        id: 'collapse-reception-operations',
        title: 'MENU.RECEPTION.OPERATIONS',
        type: 'collapse',
        icon: 'add_circle_outline',
        ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY,
        children: [
          {
            id: 'collapse-reception-olive',
            title: 'MENU.RECEPTION.OLIVE',
            type: 'collapse',
            icon: 'spa',
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
          }
        ]
      },
      {
        id: 'collapse-reception-history',
        title: 'MENU.RECEPTION.HISTORY',
        type: 'collapse',
        icon: 'history',
        ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY,
        children: [
          {
            id: 'item-reception-list-olive-all',
            title: 'MENU.PRODUCTION.ALL_OLIVE_RECEPTIONS',
            type: 'item',
            url: '/reception/reception-list/olive',
            icon: 'list',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-list-olive-simple',
            title: 'AUTO.TRITURATION_PARTICULIER',
            type: 'item',
            url: '/reception/reception-list/olive/SIMPLE_RECEPTION',
            icon: 'person',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-list-olive-base',
            title: 'AUTO.TRITURATION_SUR_BASE',
            type: 'item',
            url: '/reception/reception-list/olive/BASE',
            icon: 'recycling',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-list-olive-purchase',
            title: 'AUTO.ACHAT_OLIVE',
            type: 'item',
            url: '/reception/reception-list/olive/OLIVE_PURCHASE',
            icon: 'shopping_basket',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-list-olive-exchange',
            title: 'OPERATION_TYPE.EXCHANGE',
            type: 'item',
            url: '/reception/reception-list/olive/EXCHANGE',
            icon: 'compare_arrows',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-list-oil',
            title: 'MENU.PRODUCTION.RECEPTION_OIL',
            type: 'item',
            url: '/reception/reception-list/oil',
            icon: 'water_drop',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          },
          {
            id: 'item-reception-purchase-journal',
            title: 'MENU.RECEPTION.PURCHASE_JOURNAL',
            type: 'item',
            url: '/reception/purchase-journal',
            icon: 'menu_book',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.UNIFIEDDELIVERY
          }
        ]
      },
      {
        id: 'collapse-reception-planning',
        title: 'MENU.RECEPTION.PLANNING',
        type: 'collapse',
        icon: 'event',
        children: [
          {
            id: 'item-reception-mill-schedules',
            title: 'AUTO.PLANNINGS_TRITURATION',
            type: 'item',
            url: '/reception/mill-schedules',
            icon: 'schedule',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)]
          }
        ]
      },
      {
        id: 'collapse-reception-partners',
        title: 'MENU.RECEPTION.PARTNERS',
        type: 'collapse',
        icon: 'groups',
        children: [
          {
            id: 'item-reception-supplier-manage',
            title: 'AUTO.FOURNISSEURS_APPORTEURS',
            type: 'item',
            url: '/reception/fournisseur',
            icon: 'contact_page',
            breadcrumbs: false,
            ressourcePermission: ReceptionEntity.SUPPLIER
          }
        ]
      }
    ]
  },

  // ─── PRODUCTION HUILE ──────────────────────────────────────────────────────
  {
    id: 'group-production',
    title: 'MENU.PRODUCTION.TITLE',
    type: 'group',
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'collapse-production-quality',
        title: 'MENU.PRODUCTION.QUALITY',
        type: 'collapse',
        icon: 'rule',
        children: [
          {
            id: 'item-quality-control-oil',
            title: 'MENU.RECEPTION.QUALITY_CONTROL_HUILE',
            type: 'item',
            url: '/reception/oil_qc',
            icon: 'science',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
          },
          {
            id: 'item-quality-control-olive',
            title: 'MENU.RECEPTION.QUALITY_CONTROL_OLIVE',
            type: 'item',
            url: '/reception/olive_qc',
            icon: 'biotech',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.QUALITYCONTROLRESULT
          }
        ]
      },
      {
        id: 'collapse-production-storage',
        title: 'MENU.PRODUCTION.STORAGE',
        type: 'collapse',
        icon: 'warehouse',
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
            title: 'AUTO.TRANSACTIONS_HUILE',
            type: 'item',
            url: '/storage/oil-transactions',
            icon: 'water_drop',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.OILTRANSACTION
          },
          {
            id: 'item-storage-oil-filtering',
            title: 'AUTO.FILTRAGE_HUILE',
            type: 'item',
            url: '/storage/oil-filtering',
            icon: 'filter_alt',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.STORAGEUNIT
          },
          {
            id: 'item-storage-containers',
            title: 'AUTO.CONTENANTS_HUILE',
            type: 'item',
            url: '/storage/oil-container',
            icon: 'inbox',
            breadcrumbs: false,
            ressourcePermission: ProductionEntity.STORAGEUNIT
          }
        ]
      }
    ]
  },

  // ─── CONDITIONNEMENT ─────────────────────────────────────────────────────────
  {
    id: 'group-conditioning',
    title: 'MENU.CONDITIONNEMENT.TITLE',
    type: 'group',
    modulePermission: 'CONDITIONING',
    children: [
      {
        id: 'collapse-conditioning-workshop',
        title: 'MENU.CONDITIONNEMENT.WORKSHOP',
        type: 'collapse',
        icon: 'precision_manufacturing',
        children: [
          {
            id: 'item-conditioning-of',
            title: 'MENU.CONDITIONNEMENT.OF',
            type: 'item',
            url: '/of',
            icon: 'factory',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.OF, Action.READ)]
          },
          {
            id: 'item-conditioning-lines',
            title: 'MENU.CONDITIONNEMENT.LINES',
            type: 'item',
            url: '/stock/lignes',
            icon: 'conveyor_belt',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.LIGNECONDITIONNEMENT, Action.READ)]
          },
          {
            id: 'item-conditioning-labels',
            title: 'MENU.CONDITIONNEMENT.LABELS',
            type: 'item',
            url: '/labels',
            icon: 'label',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.LABELCONTENT, Action.READ)]
          }
        ]
      },
      {
        id: 'collapse-conditioning-logistics',
        title: 'MENU.CONDITIONNEMENT.LOGISTICS',
        type: 'collapse',
        icon: 'local_shipping',
        children: [
          {
            id: 'item-projet-list',
            title: 'MENU.CONDITIONNEMENT.PROJECTS',
            type: 'item',
            url: '/projets',
            icon: 'folder_open',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.PROJET, Action.READ)]
          },
          {
            id: 'item-projet-expeditions',
            title: 'MENU.CONDITIONNEMENT.EXPEDITIONS',
            type: 'item',
            url: '/projets/expeditions',
            icon: 'route',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.EXPEDITION, Action.READ)]
          },
          {
            id: 'item-client-cond',
            title: 'MENU.CUSTOMERS.TITLE',
            type: 'item',
            url: '/projets/clients',
            icon: 'groups',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.CLIENT, Action.READ)]
          }
        ]
      },
      {
        id: 'collapse-conditioning-analytics',
        title: 'MENU.CONDITIONNEMENT.ANALYTICS',
        type: 'collapse',
        icon: 'insights',
        permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.ANALYTICS, Action.READ)],
        children: [
          {
            id: 'item-analytics-of-yield',
            title: 'AUTO.RENDEMENTS_DES_OF',
            type: 'item',
            url: '/analytics/of-yield',
            icon: 'speed',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.ANALYTICS, Action.REPORT)]
          },
          {
            id: 'item-analytics-quality',
            title: 'AUTO.QUALITE_NON_CONFORMITES',
            type: 'item',
            url: '/analytics/quality',
            icon: 'fact_check',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.ANALYTICS, Action.REPORT)]
          },
          {
            id: 'item-analytics-bom-gap',
            title: 'AUTO.ECARTS_NOMENCLATURES_BOM',
            type: 'item',
            url: '/analytics/bom-gap',
            icon: 'difference',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.ANALYTICS, Action.REPORT)]
          },
          {
            id: 'item-analytics-filtration',
            title: 'AUTO.EFFICACITE_FILTRAGE',
            type: 'item',
            url: '/analytics/filtration',
            icon: 'filter_alt',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.ANALYTICS, Action.REPORT)]
          }
        ]
      }
    ]
  },

  // ─── STOCKS & INVENTAIRE ─────────────────────────────────────────────────────
  {
    id: 'group-inventory',
    title: 'MENU.STOCKS_INV.TITLE',
    type: 'group',
    modulePermission: 'INVENTAIR',
    children: [
      {
        id: 'collapse-stock-catalog',
        title: 'MENU.STOCKS_INV.ITEMS',
        type: 'collapse',
        icon: 'inventory_2',
        children: [
          {
            id: 'item-stocks-articles',
            title: 'AUTO.ARTICLES_DE_COND',
            type: 'item',
            url: '/stock/articles',
            icon: 'category',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.ARTICLESEC, Action.READ)]
          },
          {
            id: 'item-stocks-products',
            title: 'AUTO.PRODUITS_FINIS',
            type: 'item',
            url: '/stock/products',
            icon: 'inventory_2',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.PRODUCT, Action.READ)]
          },
          {
            id: 'item-stocks-bom',
            title: 'AUTO.NOMENCLATURES_BOM',
            type: 'item',
            url: '/stock/boms',
            icon: 'receipt',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.BOM, Action.READ)]
          }
        ]
      },
      {
        id: 'collapse-stock-operations',
        title: 'MENU.STOCKS_INV.OPERATIONS',
        type: 'collapse',
        icon: 'inventory',
        children: [
          {
            id: 'item-stocks-mouvements',
            title: 'AUTO.MOUVEMENTS_STOCK',
            type: 'item',
            url: '/stock/mouvements',
            icon: 'swap_horiz',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.MOUVEMENTSTOCKSEC, Action.READ)]
          },
          {
            id: 'item-stocks-emplacements',
            title: 'AUTO.EMPLACEMENTS',
            type: 'item',
            url: '/stock/emplacements',
            icon: 'grid_view',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.EMPLACEMENTSTOCK, Action.READ)]
          },
          {
            id: 'item-stocks-par-emplacement',
            title: 'AUTO.STOCK_PAR_ZONE',
            type: 'item',
            url: '/stock/par-emplacement',
            icon: 'view_list',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ)]
          },
          {
            id: 'item-stocks-audit',
            title: 'AUTO.JOURNAL_D_AUDIT',
            type: 'item',
            url: '/stock/audit',
            icon: 'history',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ)]
          }
        ]
      },
      {
        id: 'collapse-stock-purchasing',
        title: 'MENU.STOCKS_INV.PURCHASING',
        type: 'collapse',
        icon: 'shopping_bag',
        children: [
          {
            id: 'item-stocks-bons-commande',
            title: 'AUTO.BONS_DE_COMMANDE',
            type: 'item',
            url: '/stock/bons-commande',
            icon: 'description',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.BONCOMMANDE, Action.READ)]
          },
          {
            id: 'item-stocks-fournisseurs',
            title: 'DASHBOARD_TITLES.MATERIEL_SUPPLIERS',
            type: 'item',
            url: '/stock/materiel-suppliers',
            icon: 'business',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.INVENTAIR, InventoryEntity.MATERIEL_SUPPLIER, Action.READ)]
          }
        ]
      }
    ]
  },

  // ─── FINANCE ─────────────────────────────────────────────────────────────────
  {
    id: 'group-finance',
    title: 'MENU.FINANCE.TITLE',
    type: 'group',
    modulePermission: 'FINANCE',
    children: [
      {
        id: 'collapse-finance-treasury',
        title: 'MENU.FINANCE.TREASURY',
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
            icon: 'account_balance_wallet',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.BANKACCOUNT
          },
          {
            id: 'item-finance-cash-register',
            title: 'MENU.FINANCE.CASH_REGISTER',
            type: 'item',
            url: '/finance/cash-register',
            icon: 'point_of_sale',
            breadcrumbs: false,
            ressourcePermission: FinanceEntity.FINANCIALTRANSACTION
          }
        ]
      },
      {
        id: 'item-finance-season-recap',
        title: 'MENU.FINANCE.SEASON_RECAP',
        type: 'item',
        url: '/finance/season-recap',
        icon: 'summarize',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)]
      },
      {
        id: 'collapse-finance-sales',
        title: 'MENU.FINANCE.SALES',
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
            permissions: [permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILCREDIT, Action.READ)],
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

  // ─── RH / HR ─────────────────────────────────────────────────────────────────
  {
    id: 'group-hr',
    title: 'MENU.HR.TITLE',
    type: 'group',
    modulePermission: 'HR',
    children: [
      {
        id: 'item-hr-employees',
        title: 'HR.QUICK_NAV.EMPLOYEES',
        type: 'item',
        url: '/hr/employees',
        icon: 'groups',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ)]
      },
      {
        id: 'item-hr-postes',
        title: 'HR.QUICK_NAV.POSITIONS',
        type: 'item',
        url: '/hr/postes',
        icon: 'badge',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.POSTE, Action.READ)]
      },
      {
        id: 'item-hr-contracts',
        title: 'HR.QUICK_NAV.CONTRACTS',
        type: 'item',
        url: '/hr/contracts',
        icon: 'description',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.CONTRACT, Action.READ)]
      },
      {
        id: 'item-hr-pointages',
        title: 'HR.QUICK_NAV.POINTAGE',
        type: 'item',
        url: '/hr/pointages',
        icon: 'schedule',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.POINTAGE, Action.READ)]
      },
      {
        id: 'item-hr-leave',
        title: 'HR.QUICK_NAV.LEAVE',
        type: 'item',
        url: '/hr/leave-requests',
        icon: 'event_busy',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.LEAVEREQUEST, Action.READ)]
      },
      {
        id: 'item-hr-payroll',
        title: 'HR.QUICK_NAV.PAYROLL',
        type: 'item',
        url: '/hr/payroll-periods',
        icon: 'calendar_month',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, Action.READ)]
      },
      {
        id: 'item-hr-payslips',
        title: 'HR.PAYSLIPS.LIST_TITLE',
        type: 'item',
        url: '/hr/payslips',
        icon: 'receipt_long',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.HR, HREntity.PAYSLIP, Action.READ)]
      }
    ]
  },

  // ─── MAINTENANCE & ÉQUIPEMENT ───────────────────────────────────────────────
  {
    id: 'group-maintenance-equipment',
    title: 'MENU.MAINTENANCE_EQUIPMENT.TITLE',
    type: 'group',
    modulePermission: 'PRODUCTION',
    children: [
      {
        id: 'item-maintenance-work-orders',
        title: 'MENU.MAINTENANCE.WORK_ORDERS',
        type: 'item',
        url: '/maintenance',
        icon: 'handyman',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.PRODUCTION, ProductionEntity.MAINTENANCEWORKORDER, Action.READ)],
        ressourcePermission: ProductionEntity.MAINTENANCEWORKORDER
      },
      {
        id: 'item-mill-equipment',
        title: 'MENU.EQUIPMENT.REGISTRY',
        type: 'item',
        url: '/mill-equipment',
        icon: 'agriculture',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.PRODUCTION, ProductionEntity.MILLEQUIPMENT, Action.READ)],
        ressourcePermission: ProductionEntity.MILLEQUIPMENT
      },
      {
        id: 'item-equipment-missions',
        title: 'MENU.EQUIPMENT.MISSIONS',
        type: 'item',
        url: '/equipment-missions',
        icon: 'local_shipping',
        breadcrumbs: false,
        permissions: [permissionKey(OOSMModule.PRODUCTION, ProductionEntity.EQUIPMENTSERVICEMISSION, Action.READ)],
        ressourcePermission: ProductionEntity.EQUIPMENTSERVICEMISSION
      }
    ]
  },

  // ─── PARAMÈTRES ──────────────────────────────────────────────────────────────
  {
    id: 'group-settings',
    title: 'MENU.SETTINGS.TITLE',
    type: 'group',
    children: [
      {
        id: 'collapse-settings-company',
        title: 'MENU.SETTINGS.COMPANY',
        type: 'collapse',
        icon: 'business',
        children: [
          {
            id: 'item-settings-general-config',
            title: 'MENU.SETTINGS.GENERAL_CONFIG',
            type: 'item',
            url: '/settings/general-config',
            icon: 'domain',
            breadcrumbs: false,
            modulePermission: 'HABILITATION',
            permissions: [permissionKey(OOSMModule.HABILITATION, HabilitationEntity.COMPANYPROFILE, Action.READ)],
            ressourcePermission: HabilitationEntity.COMPANYPROFILE
          }
        ]
      },
      {
        id: 'collapse-settings-quality',
        title: 'MENU.SETTINGS.QUALITY_EQUIPMENT',
        type: 'collapse',
        icon: 'verified',
        children: [
          {
            id: 'item-settings-quality-rules',
            title: 'MENU.SETTINGS.QUALITY_CONTROL_RULES',
            type: 'item',
            url: '/settings/quality-control',
            icon: 'rule',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRULE, Action.READ)],
            ressourcePermission: ProductionEntity.QUALITYCONTROLRULE
          },
          {
            id: 'item-settings-certifications',
            title: 'AUTO.CERTIFICATIONS',
            type: 'item',
            url: '/labels/certifications',
            icon: 'verified_user',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.CERTIFICATION, Action.READ)],
            ressourcePermission: ProductionEntity.CERTIFICATION
          },
          {
            id: 'item-settings-mill-machines',
            title: 'MENU.SETTINGS.MILLING_MACHINES',
            type: 'item',
            url: '/reception/mill-machines',
            icon: 'settings_input_component',
            breadcrumbs: false,
            permissions: [permissionKey(OOSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.READ)],
            ressourcePermission: ProductionEntity.MILLMACHINE
          }
        ]
      },
      {
        id: 'collapse-settings-security',
        title: 'MENU.SETTINGS.SECURITY',
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
            modulePermission: 'HABILITATION',
            ressourcePermission: HabilitationEntity.OOSMUSER
          },
          {
            id: 'item-settings-roles',
            title: 'MENU.SETTINGS.ROLES',
            type: 'item',
            url: '/settings/roles',
            icon: 'admin_panel_settings',
            breadcrumbs: false,
            modulePermission: 'HABILITATION',
            ressourcePermission: HabilitationEntity.ROLE
          }
        ]
      }
    ]
  }
];
