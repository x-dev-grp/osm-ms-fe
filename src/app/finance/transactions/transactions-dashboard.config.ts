import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const TRANSACTIONS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'account_balance_wallet',
  /* ───────────────────────────── méta ───────────────────────────── */
  title: 'Transactions Financières',
  titleTranslatePath: 'TRANSACTIONS.TITLE',
  baseURL: 'finance/transactions',
  searchEndpoint: 'finance/transactions',

  /* ─────────────────── bouton "ajouter une transaction" ─────────────── */
  addNewItem: true,
  addNewItemUrl: '/finance/transactions/new',

  /* ─────────────────────────── colonnes du tableau ──────────────── */
  fields: [
    {
      name: 'transactionType',
      label: 'Type de Transaction',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.TRANSACTION_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'PAYMENT', label: 'Paiement', labelTranslatePath: 'TRANSACTIONS.TYPES.PAYMENT' },
        { value: 'EXPENSE', label: 'Dépense', labelTranslatePath: 'TRANSACTIONS.TYPES.EXPENSE' },
        { value: 'PURCHASE', label: 'Achat', labelTranslatePath: 'TRANSACTIONS.TYPES.PURCHASE' },
        { value: 'CREDIT', label: 'Crédit', labelTranslatePath: 'TRANSACTIONS.TYPES.CREDIT' },
        { value: 'DEBIT', label: 'Débit', labelTranslatePath: 'TRANSACTIONS.TYPES.DEBIT' },
        { value: 'LOAN', label: 'Prêt', labelTranslatePath: 'TRANSACTIONS.TYPES.LOAN' },
        { value: 'INTERNAL_TRANSFER', label: 'Transfert Interne', labelTranslatePath: 'TRANSACTIONS.TYPES.INTERNAL_TRANSFER' },
        { value: 'OIL_SALE', label: "Vente d'Huile", labelTranslatePath: 'TRANSACTIONS.TYPES.OIL_SALE' },
        { value: 'OIL_PURCHASE', label: "Achat d'Huile", labelTranslatePath: 'TRANSACTIONS.TYPES.OIL_PURCHASE' },
        { value: 'SUPPLIER_PAYMENT', label: 'Paiement Fournisseur', labelTranslatePath: 'TRANSACTIONS.TYPES.SUPPLIER_PAYMENT' },
        { value: 'SUPPLIER_CREDIT', label: 'Crédit Fournisseur', labelTranslatePath: 'TRANSACTIONS.TYPES.SUPPLIER_CREDIT' },
        { value: 'DEPOSIT', label: 'Dépôt', labelTranslatePath: 'TRANSACTIONS.TYPES.DEPOSIT' },
        { value: 'WITHDRAWAL', label: 'Retrait', labelTranslatePath: 'TRANSACTIONS.TYPES.WITHDRAWAL' },
        { value: 'CHECK_DEPOSIT', label: 'Dépôt de Chèque', labelTranslatePath: 'TRANSACTIONS.TYPES.CHECK_DEPOSIT' },
        { value: 'CHECK_PAYMENT', label: 'Paiement par Chèque', labelTranslatePath: 'TRANSACTIONS.TYPES.CHECK_PAYMENT' }
      ]
    },
    {
      name: 'direction',
      label: 'Direction',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.DIRECTION',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'INBOUND', label: 'Entrée', labelTranslatePath: 'TRANSACTIONS.DIRECTIONS.INBOUND' },
        { value: 'OUTBOUND', label: 'Sortie', labelTranslatePath: 'TRANSACTIONS.DIRECTIONS.OUTBOUND' },
        { value: 'INTERNAL', label: 'Interne', labelTranslatePath: 'TRANSACTIONS.DIRECTIONS.INTERNAL' }
      ]
    },
    {
      name: 'amount',
      label: 'Montant',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'currency',
      label: 'Devise',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.CURRENCY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'TND', label: 'Dinar Tunisien', labelTranslatePath: 'TRANSACTIONS.CURRENCIES.TND' },
        { value: 'EUR', label: 'Euro', labelTranslatePath: 'TRANSACTIONS.CURRENCIES.EUR' },
        { value: 'USD', label: 'Dollar US', labelTranslatePath: 'TRANSACTIONS.CURRENCIES.USD' }
      ]
    },
    {
      name: 'operationType',
      label: 'Type de trituration',
      labelTranslatePath: 'BASE_TYPE.OPERATION_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Trituration particulier', value: 'SIMPLE_RECEPTION', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION' },
        { label: 'Base', value: 'BASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.BASE' },
        { label: 'Achat Olive', value: 'OLIVE_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE' },
        { label: 'Achat Huile', value: 'OIL_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE' },
        { label: 'Echange', value: 'EXCHANGE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' },
        { label: 'Paiement', value: 'PAYMENT', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.PAYMENT' },
        { label: 'Vente Huile', value: 'OIL_SALE', labelTranslatePath: 'TRANSACTIONS.TYPES.OIL_SALE' }
      ]
    },
    {
      name: 'paymentMethod',
      label: 'Méthode de Paiement',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.PAYMENT_METHOD',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'CASH', label: 'Espèces', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.CASH' },
        { value: 'BANK_TRANSFER', label: 'Virement Bancaire', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.BANK_TRANSFER' },
        { value: 'CHECK', label: 'Chèque', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.CHECK' },
        { value: 'CREDIT_CARD', label: 'Carte de Crédit', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.CREDIT_CARD' },
        { value: 'DEBIT_CARD', label: 'Carte de Débit', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.DEBIT_CARD' },
        { value: 'MOBILE_PAYMENT', label: 'Paiement Mobile', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.MOBILE_PAYMENT' },
        { value: 'OIL_CREDIT', label: 'Crédit Huile', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.OIL_CREDIT' }
      ]
    },

    {
      name: 'supplier.name',
      label: 'Fournisseur',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.SUPPLIER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lotNumber',
      label: 'Numéro de Lot',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
    },
    {
      name: 'invoiceReference',
      label: 'Référence Facture',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.INVOICE_REFERENCE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'receiptReference',
      label: 'Référence Reçu',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.RECEIPT_REFERENCE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'transactionDate',
      label: 'Date de Transaction',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.TRANSACTION_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'approved',
      label: 'Approuvé',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.APPROVED',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'approvalDate',
      label: "Date d'Approbation",
      labelTranslatePath: 'TRANSACTIONS.FIELDS.APPROVAL_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'bankAccount.accountNumber',
      label: 'Compte Bancaire',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.BANK_ACCOUNT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'checkNumber',
      label: 'Numéro de Chèque',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.CHECK_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'createdDate',
      label: 'Date de Création',
      labelTranslatePath: 'TRANSACTIONS.FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],

  /* ──────────────── nom du fichier exporté (optionnel) ───────────── */
  fileName: 'financial_transactions',

  /* ──────────────── configuration de recherche ───────────── */
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: {
          equalValue: false
        }
      },
      searchs: []
    }
  }
};
