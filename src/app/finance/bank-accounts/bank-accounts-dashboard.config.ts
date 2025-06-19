import {
  Action,
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const BANK_ACCOUNTS_DASHBOARD_CONFIG: DashboardConfig = {
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
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
     ],

  /* ── Menu actions (no status mapping) ───────────────────────── */
  actions: {
    statusMapping: false,
    actionsList: <Action[]>[
      { label: 'Voir',      icon: 'visibility', value: 'VIEW' },
      { label: 'Modifier',  icon: 'edit',       value: 'EDIT' },
      { label: 'Supprimer', icon: 'delete',     value: 'DELETE' }
    ]
  },
  fileName: 'comptes-bancaires'
};
