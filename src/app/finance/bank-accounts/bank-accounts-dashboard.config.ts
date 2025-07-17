import {
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const BANK_ACCOUNTS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'account_balance',
  title: 'Comptes bancaires',
  titleTranslatePath: 'BANK_ACCOUNTS.TITLE',
  baseURL: 'finance/banks',
  searchEndpoint: 'finance/banks',
  addNewItem: true,
  addNewItemUrl: 'finance/banks/new',

  /* ── Data-table columns & filter metadata ───────────────────── */
  fields: [
    {
      name: 'rib',
      label: 'RIB',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.RIB',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'iban',
      label: 'IBAN',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.IBAN',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'bicSwift',
      label: 'BIC / SWIFT',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.BIC_SWIFT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'bankName',
      label: 'Nom de la banque',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.BANK_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'bankBranch',
      label: 'Agence',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.BANK_BRANCH',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'currency',
      label: 'Devise',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.CURRENCY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'accountType',
      label: 'Type de compte',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.ACCOUNT_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'active',
      label: 'Actif',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
     ],

  /* ── Menu actions (no status mapping) ───────────────────────── */

  fileName: 'comptes-bancaires'
};
