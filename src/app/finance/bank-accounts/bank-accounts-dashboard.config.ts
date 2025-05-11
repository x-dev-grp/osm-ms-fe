import {
  Action,
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const BANK_ACCOUNTS_DASHBOARD_CONFIG: DashboardConfig = {
  title: 'Bank Accounts',
  baseURL: 'finance/banks',
  searchEndpoint: 'finance/banks',

  addNewItem: true,
  addNewItemUrl: 'finance/banks/new',

  /* ── Data-table columns & filter metadata ───────────────────── */
  fields: [
    { name: 'rib',        label: 'RIB',           exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true, sortable: true, filterable: true },
    { name: 'iban',       label: 'IBAN',          exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true, sortable: true, filterable: true },
    { name: 'bicSwift',   label: 'BIC / SWIFT',   exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true, sortable: true },
    { name: 'bankName',   label: 'Bank Name',     exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true, sortable: true, filterable: true },
    { name: 'bankBranch', label: 'Branch',        exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true },
    { name: 'currency',   label: 'Currency',      exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true, filterable: true },
    { name: 'accountType',label: 'Account Type',  exportable:true,attributeType: AttributeType.string, fieldType: FieldType.text, dataTable: true, filterable: true },
    { name: 'isPrimary',  label: 'Default',       exportable:true,attributeType: AttributeType.boolean,fieldType: FieldType.checkbox, dataTable: true },
    { name: 'active',     label: 'Active',        exportable:true,attributeType: AttributeType.boolean,fieldType: FieldType.checkbox, dataTable: true }
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

  fileName: 'bank-accounts'
};
