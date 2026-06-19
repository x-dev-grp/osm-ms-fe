/**
 * Sync missing i18n keys across en.json, fr.json, ar.json
 * Run: node scripts/i18n-sync.cjs
 */
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '../src/assets/i18n');
const AUDIT_DIR = path.join(__dirname, '../i18n-audit');
const LANGS = ['en', 'fr', 'ar'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function setByPath(obj, compoundKey, value) {
  const parts = compoundKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];
    if (next === undefined || next === null || typeof next !== 'object' || Array.isArray(next)) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') {
    return target;
  }
  for (const [key, value] of Object.entries(source)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(target[key] ?? {}, value);
    } else if (target[key] === undefined || target[key] === '') {
      target[key] = value;
    }
  }
  return target;
}

function humanize(key) {
  return key
    .split('.')
    .pop()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function loadJson(lang) {
  return JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${lang}.json`), 'utf8'));
}

function saveJson(lang, data) {
  fs.writeFileSync(path.join(I18N_DIR, `${lang}.json`), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function loadLines(file) {
  const p = path.join(AUDIT_DIR, file);
  if (!fs.existsSync(p)) {
    return [];
  }
  return fs.readFileSync(p, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
}

// ─── Explicit trilingual patches (critical / used-in-code keys) ───────────────
const PATCH = {
  en: {
    'ADMIN.SEARCH': 'Search',
    'AUTO.CHAMP_OBLIGATOIRE': 'Required field',
    'BANK_ACCOUNTS.ERRORS.BALANCE_MIN': 'Balance must be zero or greater',
    'BANK_ACCOUNTS.FIELDS.BALANCE': 'Balance',
    'BANK_ACCOUNTS.FIELDS.LAST_TRANSACTION_DATE': 'Last transaction date',
    'CANCEL': 'Cancel',
    'COMMON.CLEAR': 'Clear',
    'COMMON.NOT_DEFINED': 'Not defined',
    'COMMON.SEARCH': 'Search',
    'COMMON.SELECT': 'Select',
    'COMMON.VALIDATION.MIN_LENGTH': 'Minimum length not met',
    'COMMON.VALIDATION.PATTERN': 'Invalid format',
    'CONTRACT.DASHBOARD.FIELDS.CONTRACT_STATUS': 'Contract status',
    'CONTRACT.DASHBOARD.FIELDS.CONTRACT_TYPE': 'Contract type',
    'CONTRACT.DASHBOARD.FIELDS.EMPLOYEE': 'Employee',
    'CONTRACT.DASHBOARD.FIELDS.END_DATE': 'End date',
    'CONTRACT.DASHBOARD.FIELDS.POSTE': 'Position',
    'CONTRACT.DASHBOARD.FIELDS.SALARY': 'Salary',
    'CONTRACT.DASHBOARD.FIELDS.START_DATE': 'Start date',
    'CONTROLE_QUALITE.FORM.VALIDATION.MAX': 'Value exceeds maximum',
    'CONTROLE_QUALITE.STORAGE_UNIT.STATUS': 'Storage unit status',
    'DASHBOARD_FIELDS.MATERIEL_SUPPLIER': 'Material supplier',
    'DELIVERIES.DETAILS.SECTIONS.DOCUMENTS': 'Documents',
    'DEPARTMENT.DASHBOARD.FIELDS.DESCRIPTION': 'Description',
    'DEPARTMENT.DASHBOARD.FIELDS.EMPLOYEES_COUNT': 'Employee count',
    'DEPARTMENT.DASHBOARD.FIELDS.MANAGER_ID': 'Manager',
    'DEPARTMENT.DASHBOARD.FIELDS.NAME': 'Name',
    'DEPARTMENT.DESCRIPTION': 'Description',
    'DEPARTMENT.MANAGER': 'Manager',
    'DEPARTMENT.NAME': 'Department name',
    'EXPENSES.ERRORS.CATEGORY_REQUIRED': 'Category is required',
    'MENU.DASHBOARDS.TITLE': 'Dashboards',
    'MENU.FINANCE.DASHBOARD_OVERVIEW': 'Finance dashboard',
    'MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING': 'Pending',
    'MENU.FINANCE.DASHBOARD.TITLE': 'Finance dashboard',
    'MENU.FINANCE.DASHBOARD.TRANSACTIONS': 'Transactions',
    'MENU.PRODUCTION.ACHAT_OLIVE': 'Olive purchase reception',
    'MENU.PRODUCTION.ECHANGE': 'Exchange reception',
    'MENU.PRODUCTION.MILL_TITLE': 'Milling unit',
    'MENU.PRODUCTION.RECEPTIONS_HUILE': 'Oil receptions',
    'MENU.PRODUCTION.RECEPTIONS_OLIVE': 'Olive receptions',
    'MENU.PRODUCTION.TRITURATION_BASE': 'Base milling reception',
    'MENU.PRODUCTION.TRITURATION_PARTICULIER': 'Private milling reception',
    'MENU.STORAGE.VIEW.FILTERED': 'Filtered',
    'MENU.STORAGE.VIEW.FILTERED_OIL': 'Filtered oil',
    'OIL_FILTRAGE_MANAGEMENT': 'Oil filtration management',
    'OIL_RECEPTION.ADD.CLIENT_REGION': 'Client region',
    'OIL_RECEPTION.QUANTITY_MAX': 'Quantity exceeds maximum',
    'OIL_RECEPTION.TOTAL_MAX': 'Total exceeds maximum',
    'OIL_SALES.FIELDS.BANK_ACCOUNT': 'Bank account',
    'OIL_SALES.FIELDS.CHECK_NUMBER': 'Check number',
    'OIL_SALES.FIELDS.EXTERNAL_TRANSACTION_ID': 'External transaction ID',
    'OIL_SALES.FIELDS.LAST_MODIFIED_DATE': 'Last modified date',
    'OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR': 'Error loading oil transaction',
    'OSM_DASHBOARD.ACTIONS.GEN_PDF_BON_LIVRAISON': 'Generate delivery note PDF',
    'PDF.ARTICLE': 'Article',
    'PDF.BASCULE': 'Weighbridge',
    'PDF.CARRIER': 'Carrier',
    'PDF.CLIENT': 'Client',
    'PDF.CLIENT_DESTINATION': 'Client destination',
    'PDF.FACTURE': 'Invoice',
    'PDF.FERME': 'Farm',
    'PDF.GEN_PDF_BON_LIVRAISON': 'Generate delivery note PDF',
    'PDF.INCOTERM': 'Incoterm',
    'PDF.LOGISTICS_INFO': 'Logistics information',
    'PDF.NOTE_DE_PAIEMENT': 'Payment note',
    'PDF.OF': 'Manufacturing order',
    'PDF.OPERATION_TYPE': 'Operation type',
    'PDF.PRODUCER': 'Producer',
    'PDF.REFERENCE_DATE': 'Reference date',
    'PDF.SHIPMENT_CONTENT': 'Shipment content',
    'PDF.SNAPSHOT_CAPTURED_AT': 'Snapshot captured at',
    'PDF.TERMS': 'Terms & conditions',
    'PDF.TRACEABILITY_GENEALOGY': 'Traceability genealogy',
    'PDF.TRANSPORTER': 'Transporter',
    'PDF.TRUCK': 'Truck',
    'PDF.UNIT': 'Unit',
    'QR.ENCRYPTED': 'Encrypted',
    'QR.ERROR.GENERATE': 'Unable to generate QR code',
    'QR.GENERATE': 'Generate QR',
    'QR.TITLE': 'QR code',
    'QR.TYPE': 'Type',
    'RECEPTION_LIST.FIELDS.CATEGORY_OLIVE_OIL': 'Olive / oil category',
    'RECEPTION_LIST.FIELDS.DESCRIPTION': 'Description',
    'RECEPTION_LIST.FIELDS.EMPTY_TRUCK_WEIGHT': 'Empty truck weight',
    'RECEPTION_LIST.FIELDS.GROSS_WEIGHT': 'Gross weight',
    'RECEPTION_LIST.FIELDS.LOT_OLIVE_NUMBER': 'Olive lot number',
    'RECEPTION_LIST.FIELDS.OIL_VARIETY': 'Oil variety',
    'RECEPTION_LIST.FIELDS.OLIVE_QUANTITY': 'Olive quantity',
    'RECEPTION_LIST.FIELDS.OLIVE_VARIETY': 'Olive variety',
    'RECEPTION_LIST.FIELDS.PARCEL': 'Parcel',
    'RECEPTION_LIST.FIELDS.RENDEMENT': 'Yield',
    'RECEPTION_LIST.FIELDS.SACK_COUNT': 'Sack count',
    'RECEPTION_LIST.FIELDS.STORAGE_UNIT': 'Storage unit',
    'RECEPTION_LIST.FIELDS.TRT_DATE': 'Milling date',
    'RECEPTION_LIST.FIELDS.TRUCK_STATE': 'Truck condition',
    'STORAGE.VIEW.FILTERED_OIL': 'Filtered oil',
    'STORAGE.VIEW.OIL_VARIETY': 'Oil variety',
    'SUPPLIER.ERRORS.LOAD': 'Unable to load supplier',
    'SUPPLIER.ERRORS.NOT_FOUND': 'Supplier not found',
    'SUPPLIER.DETAILS.COUNT': 'Count',
    'SUPPLIER.DETAILS.NO_EMAIL': 'No email',
    'SUPPLIER.DETAILS.TOTAL': 'Total',
    'SUPPLIER_PAYMENT.ERRORS.AMOUNT_MAX': 'Amount exceeds maximum',
    'TRANSACTIONS.ACTIONS.ADD': 'Add transaction',
    'TRANSACTIONS.ACTIONS.APPROVE': 'Approve',
    'TRANSACTIONS.ACTIONS.DELETE': 'Delete',
    'TRANSACTIONS.ACTIONS.EDIT': 'Edit transaction',
    'TRANSACTIONS.ACTIONS.EXPORT': 'Export',
    'TRANSACTIONS.ACTIONS.PRINT': 'Print',
    'TRANSACTIONS.ACTIONS.REJECT': 'Reject',
    'TRANSACTIONS.ACTIONS.VIEW': 'View',
    'TRANSACTIONS.ERRORS.AMOUNT_MIN': 'Amount must be greater than zero',
    'TRANSACTIONS.ERRORS.AMOUNT_REQUIRED': 'Amount is required',
    'TRANSACTIONS.ERRORS.CREATE_ERROR': 'Error creating transaction',
    'TRANSACTIONS.ERRORS.DIRECTION_REQUIRED': 'Direction is required',
    'TRANSACTIONS.ERRORS.PAYMENT_METHOD_REQUIRED': 'Payment method is required',
    'TRANSACTIONS.ERRORS.TRANSACTION_DATE_REQUIRED': 'Transaction date is required',
    'TRANSACTIONS.ERRORS.TRANSACTION_TYPE_REQUIRED': 'Transaction type is required',
    'TRANSACTIONS.ERRORS.UPDATE_ERROR': 'Error updating transaction',
    'TRANSACTIONS.FIELDS.CUSTOMER': 'Customer',
    'TRANSACTIONS.MESSAGES.APPROVE_ERROR': 'Error approving transaction',
    'TRANSACTIONS.MESSAGES.APPROVE_SUCCESS': 'Transaction approved successfully',
    'TRANSACTIONS.MESSAGES.CREATE_ERROR': 'Error creating transaction',
    'TRANSACTIONS.MESSAGES.CREATE_SUCCESS': 'Transaction created successfully',
    'TRANSACTIONS.MESSAGES.DELETE_ERROR': 'Error deleting transaction',
    'TRANSACTIONS.MESSAGES.DELETE_SUCCESS': 'Transaction deleted successfully',
    'TRANSACTIONS.MESSAGES.DUPLICATE_SUCCESS': 'Transaction duplicated successfully',
    'TRANSACTIONS.MESSAGES.LOAD_ERROR': 'Error loading transactions',
    'TRANSACTIONS.MESSAGES.REJECT_ERROR': 'Error rejecting transaction',
    'TRANSACTIONS.MESSAGES.REJECT_SUCCESS': 'Transaction rejected successfully',
    'TRANSACTIONS.MESSAGES.UPDATE_ERROR': 'Error updating transaction',
    'TRANSACTIONS.MESSAGES.UPDATE_SUCCESS': 'Transaction updated successfully',
    'TRANSACTIONS.PAYMENT_METHODS.BOTH': 'Both',
    'TRANSACTIONS.PAYMENT_METHODS.CREDIT_CARD': 'Credit card',
    'TRANSACTIONS.PAYMENT_METHODS.DEBIT_CARD': 'Debit card',
    'TRANSACTIONS.PAYMENT_METHODS.MIXED': 'Mixed payment',
    'TRANSACTIONS.PAYMENT_METHODS.MOBILE_PAYMENT': 'Mobile payment',
    'TRANSACTIONS.PLACEHOLDERS.DESCRIPTION': 'Enter transaction description…',
    'TRANSACTIONS.PLACEHOLDERS.INVOICE_REFERENCE': 'Enter invoice reference…',
    'TRANSACTIONS.PLACEHOLDERS.LOT_NUMBER': 'Enter lot number…',
    'TRANSACTIONS.PLACEHOLDERS.RECEIPT_REFERENCE': 'Enter receipt reference…',
    'TRANSACTIONS.STATUS.REJECTED': 'Rejected',
    'TRANSACTIONS.SUMMARY.APPROVED_TRANSACTIONS': 'Approved transactions',
    'TRANSACTIONS.SUMMARY.BALANCE': 'Balance',
    'TRANSACTIONS.SUMMARY.PENDING_TRANSACTIONS': 'Pending transactions',
    'TRANSACTIONS.SUMMARY.TOTAL_AMOUNT': 'Total amount',
    'TRANSACTIONS.SUMMARY.TOTAL_INBOUND': 'Total inbound',
    'TRANSACTIONS.SUMMARY.TOTAL_OUTBOUND': 'Total outbound',
    'TRANSACTIONS.SUMMARY.TOTAL_TRANSACTIONS': 'Total transactions',
    'AUTO.PDF_SUPPLIER': 'Supplier',
    'AUTO.PDF_PRODUCER': 'Producer',
    'AUTO.PDF_TRANSPORTER': 'Transporter',
    'AUTO.PDF_FERME': 'Farm',
    'AUTO.PDF_PARCEL': 'Parcel',
    'AUTO.PDF_ERROR': 'PDF error',
    'AUTO.CONTROLE_QUALITE_STORAGE_UNIT_LABEL': 'Storage unit'
  },
  fr: {
    'ADMIN.SEARCH': 'Rechercher',
    'AUTO.CHAMP_OBLIGATOIRE': 'Champ obligatoire',
    'BANK_ACCOUNTS.ERRORS.BALANCE_MIN': 'Le solde doit être supérieur ou égal à 0',
    'BANK_ACCOUNTS.FIELDS.BALANCE': 'Solde',
    'BANK_ACCOUNTS.FIELDS.LAST_TRANSACTION_DATE': 'Date de dernière transaction',
    'CANCEL': 'Annuler',
    'COMMON.CLEAR': 'Effacer',
    'COMMON.NOT_DEFINED': 'Non défini',
    'COMMON.SEARCH': 'Rechercher',
    'COMMON.SELECT': 'Sélectionner',
    'COMMON.VALIDATION.MIN_LENGTH': 'Longueur minimale non respectée',
    'COMMON.VALIDATION.PATTERN': 'Format invalide',
    'CONTRACT.DASHBOARD.FIELDS.CONTRACT_STATUS': 'Statut du contrat',
    'CONTRACT.DASHBOARD.FIELDS.CONTRACT_TYPE': 'Type de contrat',
    'CONTRACT.DASHBOARD.FIELDS.EMPLOYEE': 'Employé',
    'CONTRACT.DASHBOARD.FIELDS.END_DATE': 'Date de fin',
    'CONTRACT.DASHBOARD.FIELDS.POSTE': 'Poste',
    'CONTRACT.DASHBOARD.FIELDS.SALARY': 'Salaire',
    'CONTRACT.DASHBOARD.FIELDS.START_DATE': 'Date de début',
    'CONTROLE_QUALITE.FORM.VALIDATION.MAX': 'La valeur dépasse le maximum',
    'CONTROLE_QUALITE.STORAGE_UNIT.STATUS': 'Statut unité de stockage',
    'DASHBOARD_FIELDS.MATERIEL_SUPPLIER': 'Fournisseur matériel',
    'DELIVERIES.DETAILS.LINKED_OIL_RECEPTION_DESC': 'Réception huile liée',
    'DELIVERIES.DETAILS.SECTIONS.DOCUMENTS': 'Documents',
    'DELIVERIES.FIELDS.SUPPLIER_LASTNAME': 'Nom du fournisseur',
    'DEPARTMENT.DASHBOARD.FIELDS.DESCRIPTION': 'Description',
    'DEPARTMENT.DASHBOARD.FIELDS.EMPLOYEES_COUNT': "Nombre d'employés",
    'DEPARTMENT.DASHBOARD.FIELDS.MANAGER_ID': 'Responsable',
    'DEPARTMENT.DASHBOARD.FIELDS.NAME': 'Nom',
    'DEPARTMENT.DESCRIPTION': 'Description',
    'DEPARTMENT.MANAGER': 'Responsable',
    'DEPARTMENT.NAME': 'Nom du département',
    'EXPENSES.ERRORS.CATEGORY_REQUIRED': 'La catégorie est requise',
    'HOME_DASHBOARD.TITLE': 'Accueil',
    'HOME_DASHBOARD.GREETING': 'Bon retour sur OSM',
    'HOME_DASHBOARD.GREETING_NAMED': 'Bon retour, {{name}}',
    'HOME_DASHBOARD.LOADING': 'Chargement de votre vue d’ensemble…',
    'HOME_DASHBOARD.LOAD_ERROR': 'Impossible de charger la vue d’ensemble.',
    'HOME_DASHBOARD.NO_MODULES': 'Aucun tableau de bord disponible pour votre compte.',
    'HOME_DASHBOARD.OPEN_MODULE': 'Ouvrir le module',
    'HOME_DASHBOARD.HERO.ATTENTION': 'À traiter',
    'HOME_DASHBOARD.HERO.ATTENTION_HINT': 'Éléments nécessitant une action',
    'HOME_DASHBOARD.HERO.MODULES': 'Modules actifs',
    'HOME_DASHBOARD.HERO.MODULES_HINT': 'Sections accessibles',
    'HOME_DASHBOARD.QUICK_LINKS.TITLE': 'Accès rapides',
    'HOME_DASHBOARD.QUICK_LINKS.STORAGE_HINT': 'Cuves, mouvements huile & stock',
    'HOME_DASHBOARD.QUICK_LINKS.STOCK_HINT': 'Articles, mouvements & commandes',
    'HOME_DASHBOARD.SECTIONS.TITLE': 'Récapitulatif par module',
    'HOME_DASHBOARD.SECTIONS.RECEPTION.TITLE': 'Réception',
    'HOME_DASHBOARD.SECTIONS.RECEPTION.SUBTITLE': 'Olives, lots huile & trituration',
    'HOME_DASHBOARD.SECTIONS.FINANCE.TITLE': 'Finance',
    'HOME_DASHBOARD.SECTIONS.FINANCE.SUBTITLE': 'Paiements, dépenses & ventes',
    'HOME_DASHBOARD.SECTIONS.STORAGE.TITLE': 'Stockage',
    'HOME_DASHBOARD.SECTIONS.STORAGE.SUBTITLE': 'Cuves et transactions huile',
    'HOME_DASHBOARD.SECTIONS.INVENTORY.TITLE': 'Inventaire',
    'HOME_DASHBOARD.SECTIONS.INVENTORY.SUBTITLE': 'Niveaux de stock & achats',
    'HOME_DASHBOARD.SECTIONS.CONDITIONING.TITLE': 'Conditionnement',
    'HOME_DASHBOARD.SECTIONS.CONDITIONING.SUBTITLE': 'Ordres de fabrication & projets',
    'HOME_DASHBOARD.SECTIONS.HR.TITLE': 'Ressources humaines',
    'HOME_DASHBOARD.SECTIONS.HR.SUBTITLE': 'Employés & dossiers RH',
    'HOME_DASHBOARD.METRICS.IN_PROGRESS': 'En cours',
    'HOME_DASHBOARD.METRICS.AWAITING_ACTION': 'En attente',
    'HOME_DASHBOARD.METRICS.UNPAID': 'Impayé',
    'HOME_DASHBOARD.METRICS.PENDING_EXPENSES': 'Dépenses en attente',
    'HOME_DASHBOARD.METRICS.TRANSACTIONS': 'Transactions',
    'HOME_DASHBOARD.METRICS.PENDING_OIL_SALES': 'Ventes huile en attente',
    'HOME_DASHBOARD.METRICS.PENDING_OIL_TX': 'Transactions huile en attente',
    'HOME_DASHBOARD.METRICS.STORAGE_UNITS': 'Unités de stockage',
    'HOME_DASHBOARD.METRICS.CRITICAL_ARTICLES': 'Articles critiques',
    'HOME_DASHBOARD.METRICS.PENDING_PURCHASE_ORDERS': 'BC en attente',
    'HOME_DASHBOARD.METRICS.TOTAL_ARTICLES': 'Total articles',
    'HOME_DASHBOARD.METRICS.PRODUCTION_ORDERS': 'Ordres de fabrication',
    'HOME_DASHBOARD.METRICS.PROJECTS': 'Projets',
    'HOME_DASHBOARD.METRICS.EMPLOYEES': 'Employés',
    'MENU.DASHBOARDS.TITLE': 'Tableaux de bord',
    'MENU.FINANCE.DASHBOARD_OVERVIEW': 'Tableau de bord finance',
    'MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING': 'En attente',
    'MENU.FINANCE.DASHBOARD.TITLE': 'Tableau de bord finance',
    'MENU.FINANCE.DASHBOARD.TRANSACTIONS': 'Transactions',
    'OIL_RECEPTION.QUANTITY_MAX': 'La quantité dépasse le maximum',
    'OIL_RECEPTION.TOTAL_MAX': 'Le total dépasse le maximum',
    'OIL_SALES.FIELDS.BANK_ACCOUNT': 'Compte bancaire',
    'OIL_SALES.FIELDS.CHECK_NUMBER': 'Numéro de chèque',
    'OIL_SALES.FIELDS.EXTERNAL_TRANSACTION_ID': 'ID transaction externe',
    'OIL_SALES.FIELDS.LAST_MODIFIED_DATE': 'Dernière modification',
    'OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR': 'Erreur de chargement de la transaction huile',
    'PDF.TERMS': 'Conditions générales',
    'PDF.GEN_PDF_BON_LIVRAISON': 'Générer PDF bon de livraison',
    'PDF.INCOTERM': 'Incoterm',
    'PDF.OF': 'Ordre de fabrication',
    'PDF.TRUCK': 'Camion',
    'RECEPTION_LIST.FIELDS.CATEGORY_OLIVE_OIL': 'Catégorie olive / huile',
    'RECEPTION_LIST.FIELDS.DESCRIPTION': 'Description',
    'RECEPTION_LIST.FIELDS.EMPTY_TRUCK_WEIGHT': 'Poids camion vide',
    'RECEPTION_LIST.FIELDS.GROSS_WEIGHT': 'Poids brut',
    'RECEPTION_LIST.FIELDS.LOT_OLIVE_NUMBER': 'N° lot olive',
    'RECEPTION_LIST.FIELDS.OIL_VARIETY': 'Variété huile',
    'RECEPTION_LIST.FIELDS.OLIVE_QUANTITY': 'Quantité olive',
    'RECEPTION_LIST.FIELDS.OLIVE_VARIETY': 'Variété olive',
    'RECEPTION_LIST.FIELDS.PARCEL': 'Parcelle',
    'RECEPTION_LIST.FIELDS.RENDEMENT': 'Rendement',
    'RECEPTION_LIST.FIELDS.SACK_COUNT': 'Nombre de sacs',
    'RECEPTION_LIST.FIELDS.STORAGE_UNIT': 'Unité de stockage',
    'RECEPTION_LIST.FIELDS.TRT_DATE': 'Date trituration',
    'RECEPTION_LIST.FIELDS.TRUCK_STATE': 'État du camion',
    'STORAGE.VIEW.FILTERED_OIL': 'Huile filtrée',
    'STORAGE.VIEW.OIL_VARIETY': 'Variété huile',
    'SUPPLIER.ERRORS.LOAD': 'Impossible de charger le fournisseur',
    'SUPPLIER.ERRORS.NOT_FOUND': 'Fournisseur introuvable',
    'TRANSACTIONS.PAYMENT_METHODS.MIXED': 'Paiement mixte',
    'AUTO.PDF_SUPPLIER': 'Fournisseur',
    'AUTO.PDF_PRODUCER': 'Producteur',
    'AUTO.PDF_TRANSPORTER': 'Transporteur',
    'AUTO.PDF_FERME': 'Ferme',
    'AUTO.PDF_PARCEL': 'Parcelle',
    'AUTO.PDF_ERROR': 'Erreur PDF',
    'AUTO.CONTROLE_QUALITE_STORAGE_UNIT_LABEL': 'Unité de stockage'
  },
  ar: {
    'ADMIN.SEARCH': 'بحث',
    'AUTO.CHAMP_OBLIGATOIRE': 'حقل مطلوب',
    'AUTO.DATE_DEBUT_CAMPAGNE': 'تاريخ بداية الحملة',
    'AUTO.DATE_FIN_CAMPAGNE': 'تاريخ نهاية الحملة',
    'AUTO.HEURE_DEBUT_CAMPAGNE': 'ساعة بداية الحملة',
    'AUTO.MARQUER_DATE_FIN': 'تحديد تاريخ النهاية',
    'BANK_ACCOUNTS.ERRORS.BALANCE_MIN': 'يجب أن يكون الرصيد أكبر من أو يساوي 0',
    'BANK_ACCOUNTS.FIELDS.BALANCE': 'الرصيد',
    'BANK_ACCOUNTS.FIELDS.LAST_TRANSACTION_DATE': 'تاريخ آخر معاملة',
    'CANCEL': 'إلغاء',
    'COMMON.CLEAR': 'مسح',
    'COMMON.NOT_DEFINED': 'غير محدد',
    'COMMON.SEARCH': 'بحث',
    'COMMON.SELECT': 'اختيار',
    'COMMON.VALIDATION.MIN_LENGTH': 'الحد الأدنى للطول غير محترم',
    'COMMON.VALIDATION.PATTERN': 'تنسيق غير صالح',
    'CONTRACT.DASHBOARD.FIELDS.CONTRACT_STATUS': 'حالة العقد',
    'CONTRACT.DASHBOARD.FIELDS.CONTRACT_TYPE': 'نوع العقد',
    'CONTRACT.DASHBOARD.FIELDS.EMPLOYEE': 'الموظف',
    'CONTRACT.DASHBOARD.FIELDS.END_DATE': 'تاريخ الانتهاء',
    'CONTRACT.DASHBOARD.FIELDS.POSTE': 'المنصب',
    'CONTRACT.DASHBOARD.FIELDS.SALARY': 'الراتب',
    'CONTRACT.DASHBOARD.FIELDS.START_DATE': 'تاريخ البداية',
    'CONTROLE_QUALITE.FORM.VALIDATION.MAX': 'القيمة تتجاوز الحد الأقصى',
    'CONTROLE_QUALITE.STORAGE_UNIT.STATUS': 'حالة وحدة التخزين',
    'DASHBOARD.ANALYTICS.BASE_UNIT_PRICE_TREND.TITLE': 'اتجاه سعر الوحدة',
    'DASHBOARD_FIELDS.MATERIEL_SUPPLIER': 'مورد المواد',
    'DASHBOARD_TITLES.MATERIEL_SUPPLIERS': 'موردو المواد',
    'DELIVERIES.DETAILS.LINKED_OIL_RECEPTION_DESC': 'استقبال زيت مرتبط',
    'DELIVERIES.DETAILS.SECTIONS.DOCUMENTS': 'المستندات',
    'DELIVERIES.FIELDS.SUPPLIER_LASTNAME': 'اسم المورد',
    'DEPARTMENT.DASHBOARD.FIELDS.DESCRIPTION': 'الوصف',
    'DEPARTMENT.DASHBOARD.FIELDS.EMPLOYEES_COUNT': 'عدد الموظفين',
    'DEPARTMENT.DASHBOARD.FIELDS.MANAGER_ID': 'المسؤول',
    'DEPARTMENT.DASHBOARD.FIELDS.NAME': 'الاسم',
    'DEPARTMENT.DESCRIPTION': 'الوصف',
    'DEPARTMENT.MANAGER': 'المسؤول',
    'DEPARTMENT.NAME': 'اسم القسم',
    'EXPENSES.ERRORS.CATEGORY_REQUIRED': 'الفئة مطلوبة',
    'FOURNISSEUR.DOMAIN.ARTICLES_BADGE': 'مورد المواد والمخزون',
    'FOURNISSEUR.DOMAIN.ARTICLES_HINT': 'للمقالات والمخزون وأوامر الشراء. منفصل عن موردي الزيتون/الزيت.',
    'FOURNISSEUR.FIELDS.CERTIFICATIONS': 'الشهادات',
    'FOURNISSEUR.FIELDS.DAYS': 'أيام',
    'FOURNISSEUR.FIELDS.LAST_ORDER_DATE': 'تاريخ آخر طلب',
    'FOURNISSEUR.FINANCE.NO_LEDGER_LINK': 'هذا النوع من الموردين للمخزون والمقالات فقط.',
    'MENU.DASHBOARDS.TITLE': 'لوحات التحكم',
    'MENU.FINANCE.DASHBOARD_OVERVIEW': 'لوحة التحكم المالية',
    'MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING': 'قيد الانتظار',
    'MENU.FINANCE.DASHBOARD.TITLE': 'لوحة التحكم المالية',
    'MENU.FINANCE.DASHBOARD.TRANSACTIONS': 'المعاملات',
    'MENU.PRODUCTION.ACHAT_OLIVE': 'استقبال شراء الزيتون',
    'MENU.PRODUCTION.ECHANGE': 'استقبال التبادل',
    'MENU.PRODUCTION.MILL_TITLE': 'وحدة الطحن',
    'MENU.PRODUCTION.RECEPTIONS': 'سجل الاستقبالات',
    'MENU.PRODUCTION.RECEPTIONS_HUILE': 'استقبالات الزيت',
    'MENU.PRODUCTION.RECEPTIONS_OLIVE': 'استقبالات الزيتون',
    'MENU.PRODUCTION.RECEPTION_OIL': 'استقبال الزيت',
    'MENU.PRODUCTION.RECEPTION_OLIVE': 'استقبال الزيتون',
    'MENU.PRODUCTION.TRITURATION_BASE': 'طحن على أساس',
    'MENU.PRODUCTION.TRITURATION_PARTICULIER': 'طحن خاص',
    'MENU.RECEPTION.QUALITY_CONTROL_HUILE': 'مراقبة جودة الزيت',
    'MENU.RECEPTION.QUALITY_CONTROL_OLIVE': 'مراقبة جودة الزيتون',
    'MENU.STORAGE.VIEW.FILTERED': 'مفلتر',
    'MENU.STORAGE.VIEW.FILTERED_OIL': 'زيت مفلتر',
    'OIL_RECEPTION.ADD.CLIENT_REGION': 'منطقة العميل',
    'OIL_RECEPTION.QUANTITY_MAX': 'الكمية تتجاوز الحد الأقصى',
    'OIL_RECEPTION.TOTAL_MAX': 'المجموع يتجاوز الحد الأقصى',
    'OIL_SALES.ACTIONS.DOCUMENTS': 'المستندات',
    'OIL_SALES.ACTIONS.LIFECYCLE': 'دورة الحياة',
    'OIL_SALES.CONFIRMATIONS.CANCEL_MESSAGE': 'هل تريد إلغاء عملية البيع هذه؟',
    'OIL_SALES.CONFIRMATIONS.CANCEL_TITLE': 'إلغاء البيع',
    'OIL_SALES.CONFIRMATIONS.CONFIRM_MESSAGE': 'هل تريد تأكيد عملية البيع هذه؟',
    'OIL_SALES.CONFIRMATIONS.CONFIRM_TITLE': 'تأكيد البيع',
    'OIL_SALES.DELIVERY.CLIENT_ADDRESS_HINT': 'استخدام عنوان العميل',
    'OIL_SALES.DELIVERY.CUSTOM_ADDRESS_HINT': 'عنوان مخصص',
    'OIL_SALES.DELIVERY.DIALOG_HINT': 'أدخل تفاصيل التسليم',
    'OIL_SALES.DELIVERY.DIALOG_TITLE': 'تسليم البيع',
    'OIL_SALES.DELIVERY.TITLE': 'التسليم',
    'OIL_SALES.DELIVERY.USE_CLIENT_ADDRESS': 'استخدام عنوان العميل',
    'OIL_SALES.FIELDS.BANK_ACCOUNT': 'الحساب البنكي',
    'OIL_SALES.FIELDS.CHECK_NUMBER': 'رقم الشيك',
    'OIL_SALES.FIELDS.DELIVERY_ADDRESS': 'عنوان التسليم',
    'OIL_SALES.FIELDS.DELIVERY_DATE': 'تاريخ التسليم',
    'OIL_SALES.FIELDS.DESCRIPTION': 'الوصف',
    'OIL_SALES.FIELDS.EXTERNAL_TRANSACTION_ID': 'معرف المعاملة الخارجية',
    'OIL_SALES.FIELDS.LAST_MODIFIED_DATE': 'آخر تعديل',
    'OIL_SALES.FORM.VALIDATION.ADDRESS_REQUIRED': 'العنوان مطلوب',
    'OIL_SALES.MESSAGES.SUCCESS.CANCEL': 'تم إلغاء البيع بنجاح',
    'OIL_SALES.MESSAGES.SUCCESS.CONFIRM': 'تم تأكيد البيع بنجاح',
    'OIL_SALES.MESSAGES.SUCCESS.DELIVER': 'تم التسليم بنجاح',
    'OIL_SALES.PAYMENT_METHODS.CHEQUE': 'شيك',
    'OIL_SALES.PAYMENT_METHODS.TRANSFER': 'تحويل',
    'OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR': 'خطأ في تحميل معاملة الزيت',
    'OSM_DASHBOARD.ACTIONS.APPROVE': 'موافقة',
    'OSM_DASHBOARD.ACTIONS.DETAIL': 'تفاصيل',
    'OSM_DASHBOARD.ACTIONS.GEN_PDF_BON_LIVRAISON': 'إنشاء PDF إذن التسليم',
    'OSM_DASHBOARD.ACTIONS.PLANNING': 'التخطيط',
    'OSM_DASHBOARD.ACTIONS.WRITE': 'كتابة',
    'PDF.ARTICLE': 'مادة',
    'PDF.BANK_DETAILS': 'تفاصيل البنك',
    'PDF.BASCULE': 'الميزان',
    'PDF.CARRIER': 'الناقل',
    'PDF.CLIENT': 'العميل',
    'PDF.CLIENT_ADDRESS': 'عنوان العميل',
    'PDF.CLIENT_DESTINATION': 'وجهة العميل',
    'PDF.CLIENT_INFO': 'معلومات العميل',
    'PDF.CLIENT_NAME': 'اسم العميل',
    'PDF.CLIENT_PHONE': 'هاتف العميل',
    'PDF.DUE_DATE': 'تاريخ الاستحقاق',
    'PDF.FACTURE': 'فاتورة',
    'PDF.FACTURE_RECEPTION': 'فاتورة استقبال',
    'PDF.FACTURE_TRITURATION': 'فاتورة طحن',
    'PDF.FACTURE_VENTE_DECHET': 'فاتورة بيع النفايات',
    'PDF.FACTURE_VENTE_HUILE': 'فاتورة بيع الزيت',
    'PDF.FERME': 'مزرعة',
    'PDF.GEN_PDF_BON_LIVRAISON': 'إنشاء PDF إذن التسليم',
    'PDF.HUILE_TYPE': 'نوع الزيت',
    'PDF.INCOTERM': 'Incoterm',
    'PDF.INVOICE': 'فاتورة',
    'PDF.INVOICE_NUMBER': 'رقم الفاتورة',
    'PDF.INVOICE_TITLE': 'عنوان الفاتورة',
    'PDF.LOGISTICS_INFO': 'معلومات لوجستية',
    'PDF.NOTE_DE_PAIEMENT': 'مذكرة دفع',
    'PDF.NOTE_PAYEMENT_RECEPTION': 'مذكرة دفع الاستقبال',
    'PDF.NOTE_PAYEMENT_TRITURATION': 'مذكرة دفع الطحن',
    'PDF.NOTE_PAYEMENT_VENTE_DECHET': 'مذكرة دفع بيع النفايات',
    'PDF.NOTE_PAYEMENT_VENTE_HUILE': 'مذكرة دفع بيع الزيت',
    'PDF.OF': 'أمر تصنيع',
    'PDF.OIL_CUSTOMER': 'عميل الزيت',
    'PDF.OPERATION_TYPE': 'نوع العملية',
    'PDF.PAYMENT_DATE': 'تاريخ الدفع',
    'PDF.PAYMENT_METHOD': 'طريقة الدفع',
    'PDF.PAYMENT_TYPE': 'نوع الدفع',
    'PDF.PRODUCER': 'منتج',
    'PDF.REFERENCE_DATE': 'تاريخ المرجع',
    'PDF.SHIPMENT_CONTENT': 'محتوى الشحنة',
    'PDF.SNAPSHOT_CAPTURED_AT': 'لقطة في',
    'PDF.TERMS': 'الشروط',
    'PDF.TRACEABILITY_GENEALOGY': 'سلسلة التتبع',
    'PDF.TRANSPORTER': 'الناقل',
    'PDF.TRUCK': 'شاحنة',
    'PDF.UNIT': 'وحدة',
    'PLANNING.CANCEL_RECEPTION': 'إلغاء الاستقبال',
    'QR.ENCRYPTED': 'مشفر',
    'QR.ERROR.GENERATE': 'تعذر إنشاء رمز QR',
    'QR.GENERATE': 'إنشاء QR',
    'QR.TITLE': 'رمز QR',
    'QR.TYPE': 'النوع',
    'RECEPTION_LIST.FIELDS.CATEGORY_OLIVE_OIL': 'فئة الزيتون / الزيت',
    'RECEPTION_LIST.FIELDS.DESCRIPTION': 'الوصف',
    'RECEPTION_LIST.FIELDS.EMPTY_TRUCK_WEIGHT': 'وزن الشاحنة فارغة',
    'RECEPTION_LIST.FIELDS.GROSS_WEIGHT': 'الوزن الإجمالي',
    'RECEPTION_LIST.FIELDS.LOT_OLIVE_NUMBER': 'رقم دفعة الزيتون',
    'RECEPTION_LIST.FIELDS.OIL_VARIETY': 'صنف الزيت',
    'RECEPTION_LIST.FIELDS.OLIVE_QUANTITY': 'كمية الزيتون',
    'RECEPTION_LIST.FIELDS.OLIVE_VARIETY': 'صنف الزيتون',
    'RECEPTION_LIST.FIELDS.PARCEL': 'القطعة',
    'RECEPTION_LIST.FIELDS.RENDEMENT': 'الإنتاجية',
    'RECEPTION_LIST.FIELDS.SACK_COUNT': 'عدد الأكياس',
    'RECEPTION_LIST.FIELDS.STORAGE_UNIT': 'وحدة التخزين',
    'RECEPTION_LIST.FIELDS.TRT_DATE': 'تاريخ الطحن',
    'RECEPTION_LIST.FIELDS.TRUCK_STATE': 'حالة الشاحنة',
    'STORAGE.VIEW.FILTERED_OIL': 'زيت مفلتر',
    'STORAGE.VIEW.OIL_VARIETY': 'صنف الزيت',
    'SUPPLIER.ERRORS.LOAD': 'تعذر تحميل المورد',
    'SUPPLIER.ERRORS.NOT_FOUND': 'المورد غير موجود',
    'SUPPLIER.DETAILS.COUNT': 'العدد',
    'SUPPLIER.DETAILS.NO_EMAIL': 'لا يوجد بريد',
    'SUPPLIER.DETAILS.TOTAL': 'المجموع',
    'SUPPLIER_PAYMENT.ERRORS.AMOUNT_MAX': 'المبلغ يتجاوز الحد الأقصى',
    'TRANSACTIONS.ACTIONS.ADD': 'إضافة معاملة',
    'TRANSACTIONS.ACTIONS.APPROVE': 'موافقة',
    'TRANSACTIONS.ACTIONS.DELETE': 'حذف',
    'TRANSACTIONS.ACTIONS.EDIT': 'تعديل',
    'TRANSACTIONS.ACTIONS.EXPORT': 'تصدير',
    'TRANSACTIONS.ACTIONS.PRINT': 'طباعة',
    'TRANSACTIONS.ACTIONS.REJECT': 'رفض',
    'TRANSACTIONS.ACTIONS.VIEW': 'عرض',
    'TRANSACTIONS.ERRORS.AMOUNT_MIN': 'يجب أن يكون المبلغ أكبر من صفر',
    'TRANSACTIONS.ERRORS.AMOUNT_REQUIRED': 'المبلغ مطلوب',
    'TRANSACTIONS.ERRORS.CREATE_ERROR': 'خطأ أثناء الإنشاء',
    'TRANSACTIONS.ERRORS.DIRECTION_REQUIRED': 'الاتجاه مطلوب',
    'TRANSACTIONS.ERRORS.PAYMENT_METHOD_REQUIRED': 'طريقة الدفع مطلوبة',
    'TRANSACTIONS.ERRORS.TRANSACTION_DATE_REQUIRED': 'تاريخ المعاملة مطلوب',
    'TRANSACTIONS.ERRORS.TRANSACTION_TYPE_REQUIRED': 'نوع المعاملة مطلوب',
    'TRANSACTIONS.ERRORS.UPDATE_ERROR': 'خطأ أثناء التحديث',
    'TRANSACTIONS.FIELDS.CUSTOMER': 'العميل',
    'TRANSACTIONS.MESSAGES.APPROVE_ERROR': 'خطأ أثناء الموافقة',
    'TRANSACTIONS.MESSAGES.APPROVE_SUCCESS': 'تمت الموافقة بنجاح',
    'TRANSACTIONS.MESSAGES.CREATE_ERROR': 'خطأ أثناء الإنشاء',
    'TRANSACTIONS.MESSAGES.CREATE_SUCCESS': 'تم الإنشاء بنجاح',
    'TRANSACTIONS.MESSAGES.DELETE_ERROR': 'خطأ أثناء الحذف',
    'TRANSACTIONS.MESSAGES.DELETE_SUCCESS': 'تم الحذف بنجاح',
    'TRANSACTIONS.MESSAGES.DUPLICATE_SUCCESS': 'تم النسخ بنجاح',
    'TRANSACTIONS.MESSAGES.LOAD_ERROR': 'خطأ أثناء التحميل',
    'TRANSACTIONS.MESSAGES.REJECT_ERROR': 'خطأ أثناء الرفض',
    'TRANSACTIONS.MESSAGES.REJECT_SUCCESS': 'تم الرفض بنجاح',
    'TRANSACTIONS.MESSAGES.UPDATE_ERROR': 'خطأ أثناء التحديث',
    'TRANSACTIONS.MESSAGES.UPDATE_SUCCESS': 'تم التحديث بنجاح',
    'TRANSACTIONS.PAYMENT_METHODS.BOTH': 'كلاهما',
    'TRANSACTIONS.PAYMENT_METHODS.CREDIT_CARD': 'بطاقة ائتمان',
    'TRANSACTIONS.PAYMENT_METHODS.DEBIT_CARD': 'بطاقة خصم',
    'TRANSACTIONS.PAYMENT_METHODS.MIXED': 'دفع مختلط',
    'TRANSACTIONS.PAYMENT_METHODS.MOBILE_PAYMENT': 'دفع عبر الهاتف',
    'TRANSACTIONS.PLACEHOLDERS.DESCRIPTION': 'أدخل وصف المعاملة…',
    'TRANSACTIONS.PLACEHOLDERS.INVOICE_REFERENCE': 'أدخل مرجع الفاتورة…',
    'TRANSACTIONS.PLACEHOLDERS.LOT_NUMBER': 'أدخل رقم الدفعة…',
    'TRANSACTIONS.PLACEHOLDERS.RECEIPT_REFERENCE': 'أدخل مرجع الإيصال…',
    'TRANSACTIONS.STATUS.REJECTED': 'مرفوض',
    'TRANSACTIONS.SUMMARY.APPROVED_TRANSACTIONS': 'معاملات موافق عليها',
    'TRANSACTIONS.SUMMARY.BALANCE': 'الرصيد',
    'TRANSACTIONS.SUMMARY.PENDING_TRANSACTIONS': 'معاملات قيد الانتظار',
    'TRANSACTIONS.SUMMARY.TOTAL_AMOUNT': 'المبلغ الإجمالي',
    'TRANSACTIONS.SUMMARY.TOTAL_INBOUND': 'إجمالي الوارد',
    'TRANSACTIONS.SUMMARY.TOTAL_OUTBOUND': 'إجمالي الصادر',
    'TRANSACTIONS.SUMMARY.TOTAL_TRANSACTIONS': 'إجمالي المعاملات',
    'WASTE.TYPES.POMACE': 'الفاكهة',
    'WASTE.TYPES.SOLID': 'صلب',
    'WASTE.TYPES.VEGETAL_SOLIDS': 'مواد نباتية صلبة',
    'DASHBOARD_TITLES.CERTIFICATIONS': 'إدارة الشهادات',
    'DASHBOARD_TITLES.ARTICLES': 'إدارة المواد',
    'DASHBOARD_TITLES.SUPPLIERS': 'إدارة الموردين',
    'DASHBOARD_TITLES.LOCATIONS': 'إدارة المواقع',
    'DASHBOARD_TITLES.PRODUCTS': 'إدارة المنتجات',
    'DASHBOARD_TITLES.BOMS': 'إدارة قوائم المواد',
    'DASHBOARD_TITLES.PURCHASE_ORDERS': 'إدارة أوامر الشراء',
    'DASHBOARD_TITLES.LINES': 'إدارة الخطوط',
    'DASHBOARD_TITLES.STOCK_BY_LOCATION': 'المخزون حسب الموقع',
    'DASHBOARD_TITLES.CLIENTS': 'إدارة العملاء',
    'DASHBOARD_TITLES.PROJECTS': 'إدارة المشاريع',
    'DASHBOARD_TITLES.EXPEDITIONS': 'إدارة الشحنات',
    'DASHBOARD_TITLES.OF': 'إدارة أوامر التصنيع',
    'DASHBOARD_TITLES.LABELS': 'إدارة الملصقات',
    'DASHBOARD_TITLES.STOCK_MOVEMENTS': 'حركات المخزون',
    'DASHBOARD_TITLES.FILTRATION': 'عمليات التصفية',
    'AUTO.PDF_SUPPLIER': 'المورد',
    'AUTO.PDF_PRODUCER': 'المنتج',
    'AUTO.PDF_TRANSPORTER': 'الناقل',
    'AUTO.PDF_FERME': 'المزرعة',
    'AUTO.PDF_PARCEL': 'القطعة',
    'AUTO.PDF_ERROR': 'خطأ PDF',
    'AUTO.CONTROLE_QUALITE_STORAGE_UNIT_LABEL': 'وحدة التخزين'
  }
};

const AR_RECEPTION_PLANNING = {
  'RECEPTION.PLANNING.COMPLETION.CHILD_LOT_COUNT': 'عدد الدفعات الفرعية',
  'RECEPTION.PLANNING.COMPLETION.COMPLETION_DATETIME_PREVIEW': 'معاينة تاريخ الإنجاز',
  'RECEPTION.PLANNING.COMPLETION.COMPLETION_SCHEDULE_TITLE': 'جدول الإنجاز',
  'RECEPTION.PLANNING.COMPLETION.COMPLETION_TIME_LABEL': 'وقت الإنجاز',
  'RECEPTION.PLANNING.COMPLETION.DELIVERY_DATETIME': 'تاريخ الاستقبال',
  'RECEPTION.PLANNING.COMPLETION.DURATION_AUTO_HINT': 'يتم حساب المدة تلقائياً',
  'RECEPTION.PLANNING.COMPLETION.DURATION_SECTION_TITLE': 'المدة',
  'RECEPTION.PLANNING.COMPLETION.DURATION_TOTAL_H': 'المدة (س)',
  'RECEPTION.PLANNING.COMPLETION.DURATION_TOTAL_HM': 'المدة (س:د)',
  'RECEPTION.PLANNING.COMPLETION.DURATION_TOTAL_M': 'المدة (د)',
  'RECEPTION.PLANNING.COMPLETION.GROSS_WEIGHT': 'الوزن الإجمالي',
  'RECEPTION.PLANNING.COMPLETION.PARCEL': 'القطعة',
  'RECEPTION.PLANNING.COMPLETION.RESET_TIMER': 'إعادة ضبط المؤقت',
  'RECEPTION.PLANNING.COMPLETION.SACK_COUNT': 'عدد الأكياس'
};

Object.assign(PATCH.ar, AR_RECEPTION_PLANNING);

// Copy EN-only SUPPLIERS.* flat keys from AR nested structure with English labels
function copySuppliersNestedToFlat(sourceFlat, targetFlat, targetLang, prefix = 'SUPPLIERS') {
  for (const [key, value] of Object.entries(sourceFlat)) {
    if (!key.startsWith(`${prefix}.`) || typeof value !== 'string' || value === '') {
      continue;
    }
    if (!(key in targetFlat) || targetFlat[key] === '') {
      targetFlat[key] = PATCH[targetLang][key] ?? value;
    }
  }
}

function resolveValue(key, lang, flats) {
  if (PATCH[lang][key]) {
    return PATCH[lang][key];
  }
  if (flats[lang][key] && flats[lang][key] !== '') {
    return flats[lang][key];
  }
  const fallbackOrder = lang === 'en' ? ['fr', 'ar'] : lang === 'fr' ? ['en', 'ar'] : ['fr', 'en'];
  for (const fb of fallbackOrder) {
    if (flats[fb][key] && flats[fb][key] !== '') {
      return flats[fb][key];
    }
  }
  return humanize(key);
}

function looksLikeKeyPath(value) {
  return typeof value === 'string'
    && /^[A-Z][A-Z0-9_.]+$/.test(value)
    && value.includes('.');
}

function main() {
  const data = {};
  const flats = {};
  for (const lang of LANGS) {
    data[lang] = loadJson(lang);
    flats[lang] = flatten(data[lang]);
  }

  // Apply explicit patches first
  for (const lang of LANGS) {
    Object.assign(flats[lang], PATCH[lang]);
  }

  // Structural merges
  data.en.TRANSACTIONS = deepMerge(data.en.TRANSACTIONS ?? {}, data.fr.TRANSACTIONS ?? {});
  data.fr.HOME_DASHBOARD = deepMerge(data.fr.HOME_DASHBOARD ?? {}, data.en.HOME_DASHBOARD ?? {});
  data.ar.FOURNISSEUR = deepMerge(data.ar.FOURNISSEUR ?? {}, data.en.FOURNISSEUR ?? {});

  // Re-flatten after structural merges
  for (const lang of LANGS) {
    flats[lang] = flatten(data[lang]);
    Object.assign(flats[lang], PATCH[lang]);
  }

  // Copy AR SUPPLIERS nested keys to EN/FR where missing
  copySuppliersNestedToFlat(flats.ar, flats.en, 'en');
  copySuppliersNestedToFlat(flats.ar, flats.fr, 'fr');

  const usedMissing = loadLines('used-keys-missing-in-en.txt');
  const union = new Set([
    ...Object.keys(flats.en),
    ...Object.keys(flats.fr),
    ...Object.keys(flats.ar),
    ...usedMissing,
    ...loadLines('missing-in-en.txt'),
    ...loadLines('missing-in-fr.txt'),
    ...loadLines('missing-in-ar.txt')
  ]);

  for (const key of union) {
    for (const lang of LANGS) {
      if (!(key in flats[lang]) || flats[lang][key] === '' || flats[lang][key] === null) {
        flats[lang][key] = resolveValue(key, lang, flats);
      }
    }
  }

  // Fix values that are unresolved key paths
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(flats[lang])) {
      if (looksLikeKeyPath(value) && !(value in flats[lang])) {
        flats[lang][key] = resolveValue(value, lang, flats);
      }
    }
  }

  // Fix EN french leftover
  if (flats.en['MENU.FINANCE.WASTE_MANAGEMENT'] === 'Gestion des déchets') {
    flats.en['MENU.FINANCE.WASTE_MANAGEMENT'] = 'Waste management';
  }

  // Fix FR typos
  flats.fr['MENU.HOME.DASHBOARD.STORAGE_RECAP'] = 'Statut du stockage';
  flats.fr['MENU.SETTINGS.APP_UI'] = 'Paramètres d\'application';

  for (const lang of LANGS) {
    const merged = JSON.parse(JSON.stringify(data[lang]));
    for (const [key, value] of Object.entries(flats[lang])) {
      if (value !== null && typeof value !== 'object') {
        setByPath(merged, key, value);
      }
    }
    saveJson(lang, merged);
  }

  // Re-run flatten stats
  const after = {};
  for (const lang of LANGS) {
    after[lang] = flatten(loadJson(lang));
  }
  const all = new Set([...Object.keys(after.en), ...Object.keys(after.fr), ...Object.keys(after.ar)]);
  const stats = {
    keyCounts: Object.fromEntries(LANGS.map((l) => [l, Object.keys(after[l]).length])),
    stillMissing: Object.fromEntries(LANGS.map((l) => [l, [...all].filter((k) => !(k in after[l]) || after[l][k] === '').length])),
    empty: Object.fromEntries(LANGS.map((l) => [l, Object.entries(after[l]).filter(([, v]) => v === '').length]))
  };
  console.log('Sync complete:', stats);
}

main();
