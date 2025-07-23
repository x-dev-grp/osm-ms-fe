import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import {
  AttributeType,
  DashboardConfig,
  FieldType,
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const EXPENSES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'payments',
  /* ───────────────────────────── méta ───────────────────────────── */
  title: 'Dépenses',
  titleTranslatePath: 'EXPENSES.TITLE',
  baseURL: 'finance/expense',
  searchEndpoint: 'finance/expense',


  /* ─────────────────── bouton "ajouter une dépense" ─────────────── */
  addNewItem: true,
  addNewItemUrl: '/finance/expenses/new',

  /* ─────────────────────────── colonnes du tableau ──────────────── */
  fields: [
    {
      name: 'invoiceRef',
      label: 'Référence facture',
      labelTranslatePath: 'EXPENSES.FIELDS.INVOICE_REF',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'purchaseNature',
      label: 'Nature de l\'achat',
      labelTranslatePath: 'EXPENSES.FIELDS.PURCHASE_NATURE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'object',
      label: 'Objet',
      labelTranslatePath: 'EXPENSES.FIELDS.OBJECT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'amount',
      label: 'Montant',
      labelTranslatePath: 'EXPENSES.FIELDS.AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'vendor',
      label: 'Fournisseur',
      labelTranslatePath: 'EXPENSES.FIELDS.VENDOR',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'category',
      label: 'Catégorie',
      labelTranslatePath: 'EXPENSES.FIELDS.CATEGORY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'paymentMethod',
      label: 'Méthode de paiement',
      labelTranslatePath: 'EXPENSES.FIELDS.PAYMENT_METHOD',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'EXPENSES.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'notes',
      label: 'Notes',
      labelTranslatePath: 'EXPENSES.FIELDS.NOTES',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
    },
    {
      name: 'receiptNumber',
      label: 'Numéro de reçu',
      labelTranslatePath: 'EXPENSES.FIELDS.RECEIPT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'createdBy',
      label: 'Créé par',
      labelTranslatePath: 'EXPENSES.FIELDS.CREATED_BY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'approved',
      label: 'Approuvé',
      labelTranslatePath: 'EXPENSES.FIELDS.APPROVED',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'approvalDate',
      label: "Date d'approbation",
      labelTranslatePath: 'EXPENSES.FIELDS.APPROVAL_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],

  /* ───────────────────────────── actions ─────────────────────────── */


  /* ──────────────── nom du fichier exporté (optionnel) ───────────── */
  fileName: 'expenses',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: []
    }
  }
};
